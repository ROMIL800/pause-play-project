import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Welcome gift + referral info for the signed-in user. */
export const getGiftStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: bonus }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("transactions")
        .select("id")
        .eq("kind", "bonus")
        .eq("reference", "signup_bonus")
        .limit(1)
        .maybeSingle(),
    ]);

    const { count } = await context.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", context.userId);

    return {
      referralCode: (profile as { referral_code?: string } | null)?.referral_code ?? "",
      claimed: Boolean(bonus),
      referrals: count ?? 0,
    };
  });

/** One-time ₹5 welcome gift for a new player. */
export const claimSignupBonus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("claim_signup_bonus", {
      _user_id: context.userId,
    });
    if (error) {
      if (/ALREADY_CLAIMED|duplicate/i.test(error.message)) {
        throw new Error("You have already claimed your welcome gift.");
      }
      throw new Error(error.message);
    }
    return { balance: Number(data), amount: 5 };
  });
