import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Is the signed-in user an admin? */
export const getIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("is_admin");
    return { isAdmin: Boolean(data) };
  });

/** Signed-in only: the UPI ID users should pay to. */
export const getDepositUpi = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("app_settings")
      .select("value")
      .eq("key", "deposit_upi_id")
      .maybeSingle();
    return { upiId: (data?.value as string | undefined) ?? "" };
  });

/** Admin: change the payable UPI ID. */
export const updateDepositUpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        upiId: z
          .string()
          .trim()
          .min(4)
          .max(80)
          .regex(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, "Invalid UPI ID"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: "deposit_upi_id", value: data.upiId }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { upiId: data.upiId };
  });

/** Admin: all deposit / withdrawal requests with the requesting user's phone. */
export const listAllRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { data: rows, error } = await context.supabase
      .from("transactions")
      .select("id, user_id, kind, amount, status, method, reference, utr, note, created_at")
      .in("kind", ["deposit", "withdraw"])
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, phone, full_name").in("id", ids)
      : { data: [] as { id: string; phone: string; full_name: string | null }[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));

    return (rows ?? []).map((r) => ({
      ...r,
      amount: Number(r.amount),
      phone: map.get(r.user_id)?.phone ?? "—",
      fullName: map.get(r.user_id)?.full_name ?? null,
    }));
  });

/** Admin: approve or reject a pending request. Approving a deposit credits the wallet. */
export const reviewRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Atomically claim the request: only one call can flip it away from an
    // un-finalised state, so a double-click or two admins cannot credit twice.
    const nextStatus = data.action === "approve" ? "approved" : "rejected";
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("transactions")
      .update({ status: `processing_${nextStatus}` })
      .eq("id", data.id)
      .in("status", ["pending", "processing_approved", "processing_rejected"])
      .select("id, user_id, kind, amount")
      .maybeSingle();
    if (claimError) throw new Error(claimError.message);
    if (!claimed) throw new Error("This request is already processed");

    if (data.action === "approve") {
      const amount = Number(claimed.amount);
      if (claimed.kind === "deposit") {
        const { error } = await supabaseAdmin.rpc("wallet_credit", {
          _user_id: claimed.user_id,
          _amount: amount,
        });
        if (error) {
          // Release the claim so the request stays actionable.
          await supabaseAdmin
            .from("transactions")
            .update({ status: "pending" })
            .eq("id", claimed.id);
          throw new Error(error.message);
        }
      } else {
        const { error } = await supabaseAdmin.rpc("place_bet_debit", {
          _user_id: claimed.user_id,
          _amount: amount,
        });
        if (error) {
          await supabaseAdmin
            .from("transactions")
            .update({ status: "pending" })
            .eq("id", claimed.id);
          throw new Error(
            /INSUFFICIENT_BALANCE/.test(error.message)
              ? "User has insufficient balance"
              : error.message,
          );
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("transactions")
      .update({ status: nextStatus })
      .eq("id", claimed.id);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

/** Admin: find an account by mobile number or User ID. Never returns secrets. */
export const searchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ query: z.string().trim().min(3).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isUuid = /^[0-9a-f-]{36}$/i.test(data.query);
    const digits = data.query.replace(/\D/g, "");

    let rows: { id: string; phone: string; full_name: string | null; created_at: string }[] = [];
    if (isUuid) {
      const { data: r, error } = await supabaseAdmin
        .from("profiles")
        .select("id, phone, full_name, created_at")
        .eq("id", data.query);
      if (error) throw new Error(error.message);
      rows = r ?? [];
    } else if (digits.length >= 4) {
      const { data: r, error } = await supabaseAdmin
        .from("profiles")
        .select("id, phone, full_name, created_at")
        .ilike("phone", `%${digits}%`)
        .limit(20);
      if (error) throw new Error(error.message);
      rows = r ?? [];
    } else {
      const { data: r, error } = await supabaseAdmin
        .from("profiles")
        .select("id, phone, full_name, created_at")
        .ilike("full_name", `%${data.query}%`)
        .limit(20);
      if (error) throw new Error(error.message);
      rows = r ?? [];
    }

    const ids = rows.map((r) => r.id);
    const { data: wallets } = ids.length
      ? await supabaseAdmin.from("wallets").select("user_id, balance").in("user_id", ids)
      : { data: [] as { user_id: string; balance: number }[] };
    const balances = new Map((wallets ?? []).map((w) => [w.user_id, Number(w.balance)]));

    return rows.map((r) => ({
      userId: r.id,
      name: r.full_name,
      phone: r.phone,
      status: "Active" as const,
      balance: balances.get(r.id) ?? 0,
      registeredAt: r.created_at,
    }));
  });

/**
 * Admin: issue a temporary password. The existing password is never readable —
 * it is overwritten, and the player must set a new permanent one at next login.
 */
export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const tempPassword = `M7${Array.from(bytes, (b) => (b % 36).toString(36))
      .join("")
      .toUpperCase()}`;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: tempPassword,
    });
    if (error) throw new Error(error.message);

    const { error: flagError } = await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", data.userId);
    if (flagError) throw new Error(flagError.message);

    return { tempPassword };
  });
