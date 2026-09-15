import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const bidSchema = z.object({
  digit: z.string().min(1).max(6),
  points: z.number().int().positive().max(100000),
  type: z.enum(["OPEN", "CLOSE", "FLOWER"]),
});

/**
 * Blocked accounts must not be able to bet or move money.
 * Throws for any account an admin has flagged as blocked.
 */
async function assertNotBlocked(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("is_blocked")
    .eq("id", userId)
    .maybeSingle();
  if (data?.is_blocked) {
    throw new Error("Your account has been blocked. Please contact support.");
  }
}

/** Profile + wallet balance for the signed-in user. */
export const getAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: wallet }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    return {
      phone: profile?.phone ?? "",
      fullName: profile?.full_name ?? null,
      balance: Number(wallet?.balance ?? 0),
    };
  });

/** All bets for the signed-in user, newest first. */
export const listBets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Place a bet: debits the wallet atomically and stores the bet. */
export const placeBet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        marketId: z.string().min(1),
        marketName: z.string().min(1),
        betType: z.string().min(1),
        betTypeName: z.string().min(1),
        rate: z.string().optional(),
        bids: z.array(bidSchema).min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertNotBlocked(context.supabase, context.userId);
    const totalPoints = data.bids.reduce((sum, b) => sum + b.points, 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: newBalance, error: debitError } = await supabaseAdmin.rpc("place_bet_debit", {
      _user_id: context.userId,
      _amount: totalPoints,
    });
    if (debitError) {
      if (/INSUFFICIENT_BALANCE/.test(debitError.message)) {
        throw new Error("Insufficient balance. Please add funds.");
      }
      throw new Error(debitError.message);
    }

    const { data: bet, error } = await supabaseAdmin
      .from("bets")
      .insert({
        user_id: context.userId,
        market_id: data.marketId,
        market_name: data.marketName,
        bet_type: data.betType,
        bet_type_name: data.betTypeName,
        rate: data.rate ?? null,
        bids: data.bids,
        total_bids: data.bids.length,
        total_points: totalPoints,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("transactions").insert({
      user_id: context.userId,
      kind: "bet",
      amount: totalPoints,
      status: "approved",
      note: `${data.marketName} — ${data.betTypeName}`,
      reference: bet.id,
    });

    return { betId: bet.id, balance: Number(newBalance) };
  });

/** Deposit / withdrawal history for the signed-in user. */
export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Submit a deposit or withdrawal request (goes to admin approval). */
export const createFundRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        kind: z.enum(["deposit", "withdraw"]),
        amount: z.number().positive().max(1000000),
        method: z.string().max(40).optional(),
        reference: z.string().max(120).optional(),
        utr: z
          .string()
          .trim()
          .regex(/^\d{12}$/, "UTR must be 12 digits")
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertNotBlocked(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.kind === "deposit") {
      if (data.amount < 300) throw new Error("Minimum deposit is ₹300");
      if (!data.utr) throw new Error("Please enter the 12-digit UTR number");
      // A UTR belongs to exactly one real bank transfer — never accept it twice.
      const { data: existingUtr } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("utr", data.utr)
        .limit(1)
        .maybeSingle();
      if (existingUtr) throw new Error("This UTR number has already been submitted");
    }

    if (data.kind === "withdraw") {
      if (data.amount < 1000) throw new Error("Minimum withdrawal is ₹1000");
      const [{ data: wallet }, { data: pendingRows }] = await Promise.all([
        context.supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", context.userId)
          .maybeSingle(),
        context.supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", context.userId)
          .eq("kind", "withdraw")
          .eq("status", "pending"),
      ]);
      // Money already reserved by pending withdrawals cannot be requested again.
      const reserved = (pendingRows ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
      const available = Number(wallet?.balance ?? 0) - reserved;
      if (available < data.amount) {
        throw new Error(
          reserved > 0
            ? `Insufficient balance — ₹${reserved} is held by pending withdrawal requests`
            : "Insufficient balance",
        );
      }
    }

    // Block accidental duplicate submissions (double tap / retry) of the
    // same amount within the last minute.
    const minuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recent } = await context.supabase
      .from("transactions")
      .select("id")
      .eq("user_id", context.userId)
      .eq("kind", data.kind)
      .eq("amount", data.amount)
      .eq("status", "pending")
      .gte("created_at", minuteAgo)
      .limit(1)
      .maybeSingle();
    if (recent)
      throw new Error("A matching request was just submitted. Please wait for it to be reviewed.");

    // Record which UPI ID the player was shown, so approvals can be audited
    // even after an admin changes the receiving UPI later.
    let note: string | null = null;
    if (data.kind === "deposit") {
      const { data: setting } = await supabaseAdmin
        .from("app_settings")
        .select("value")
        .eq("key", "deposit_upi_id")
        .maybeSingle();
      const paidTo = (setting?.value as string | undefined) ?? "";
      if (!paidTo) throw new Error("Payments are temporarily unavailable. Please contact support.");
      note = `Paid to ${paidTo}`;
    }

    const { data: created, error } = await context.supabase
      .from("transactions")
      .insert({
        user_id: context.userId,
        kind: data.kind,
        amount: data.amount,
        status: "pending",
        method: data.method ?? null,
        reference: data.reference ?? null,
        utr: data.utr ?? null,
        note,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, requestId: created.id };
  });
