import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Register a new player with mobile number + password.
 * Passwords are never stored by the app — Cloud Auth stores a bcrypt hash.
 */
export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        phone: z
          .string()
          .trim()
          .regex(/^(\d{10}|91\d{10})$/, "Enter a valid 10-digit mobile number"),
        fullName: z.string().trim().min(2).max(60),
        password: z.string().min(6).max(72),
        referralCode: z.string().trim().max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { normalizePhone, syntheticEmail } = await import("@/lib/phone");
    const phone = normalizePhone(data.phone);
    const email = syntheticEmail(phone);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (existing) {
      throw new Error("An account with this mobile number already exists. Please log in.");
    }

    // Sign-in uses a deterministic address derived from the mobile number, so
    // no SMS provider is required and the same credentials work on any host.
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      phone: `+${phone}`,
      password: data.password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { phone, full_name: data.fullName },
    });
    if (error) {
      if (/already|registered|duplicate/i.test(error.message)) {
        throw new Error("An account with this mobile number already exists. Please log in.");
      }
      throw new Error(error.message);
    }

    const userId = created?.user?.id;
    if (!userId) throw new Error("Could not create the account. Please try again.");

    // No database trigger owns these rows, so the account's profile, wallet
    // and player role are created here as part of registration.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, phone, full_name: data.fullName }, { onConflict: "id" });
    if (profileError) throw new Error(profileError.message);

    await supabaseAdmin.from("wallets").upsert({ user_id: userId }, { onConflict: "user_id" });
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role" });

    // Referral reward (₹5 to the referrer) — never blocks registration.
    if (data.referralCode) {
      await supabaseAdmin.rpc("pay_referral_bonus", {
        _new_user_id: userId,
        _code: data.referralCode,
      });
    }

    return { ok: true, phone, email };
  });

/** Does the signed-in user still have to pick a new permanent password? */
export const getPasswordStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", context.userId)
      .maybeSingle();
    return { mustChangePassword: Boolean(data?.must_change_password) };
  });

/** Called after the user has set their own new password. */
export const clearPasswordResetFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
