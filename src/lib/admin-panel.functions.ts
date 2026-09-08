import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Resolve an admin login identifier (owner username or mobile number) to the
 * Cloud Auth login address. No password or secret is involved — the password
 * is verified by Cloud Auth itself.
 */
export const resolveAdminLogin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ identifier: z.string().trim().min(3).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { normalizePhone, syntheticEmail, isValidMobile } = await import("@/lib/phone");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("app_settings")
      .select("key, value")
      .in("key", ["admin_username", "admin_phone", "admin_phone_alt"]);

    if (error) {
      console.error("[admin-login] settings lookup failed:", error.message);
      throw new Error("Sign-in is temporarily unavailable. Please try again shortly.");
    }

    const map = new Map((rows ?? []).map((r) => [r.key, r.value]));
    const username = (map.get("admin_username") ?? "").trim().toLowerCase();
    const primaryPhone = (map.get("admin_phone") ?? "").trim();
    // Alternate mobile numbers that must reach the SAME admin account.
    const aliasPhones = (map.get("admin_phone_alt") ?? "")
      .split(",")
      .map((p) => normalizePhone(p.trim()))
      .filter(Boolean);

    const identifier = data.identifier.trim();

    if (primaryPhone && identifier.toLowerCase() === username) {
      return { phone: normalizePhone(primaryPhone), email: syntheticEmail(primaryPhone) };
    }

    if (isValidMobile(identifier)) {
      const normalized = normalizePhone(identifier);
      // An alias mobile signs in to the primary admin account — one account,
      // one password, two ways to reach it.
      if (primaryPhone && aliasPhones.includes(normalized)) {
        return { phone: normalizePhone(primaryPhone), email: syntheticEmail(primaryPhone) };
      }
      return { phone: normalized, email: syntheticEmail(normalized) };
    }

    throw new Error("No admin account matches that username or mobile number");
  });


/**
 * Admin: change the sign-in password. The current password is verified by the
 * authentication backend itself (never compared in the browser or database).
 */
export const adminChangePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        currentPassword: z.string().min(6).max(72),
        newPassword: z.string().min(8).max(72),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden: this account does not have admin access");
    if (data.currentPassword === data.newPassword)
      throw new Error("The new password must be different from the current one");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userRes, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    const loginEmail = userRes?.user?.email;
    if (userError || !loginEmail) {
      console.error("[admin-password] user lookup failed:", userError?.message);
      throw new Error("Could not verify your account. Please try again.");
    }

    // Verify the CURRENT password against the auth backend.
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"];
    const publishable = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !publishable) throw new Error("Sign-in is temporarily unavailable.");
    const verifier = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (headers.get("Authorization") === `Bearer ${publishable}`)
            headers.delete("Authorization");
          headers.set("apikey", publishable);
          return fetch(input, { ...init, headers });
        },
      },
    });
    const { error: signInError } = await verifier.auth.signInWithPassword({
      email: loginEmail,
      password: data.currentPassword,
    });
    if (signInError) throw new Error("Current password is incorrect");
    await verifier.auth.signOut();

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.newPassword,
    });
    if (updateError) {
      console.error("[admin-password] update failed:", updateError.message);
      throw new Error("Could not update the password. Please try again.");
    }

    await logAction(context.userId, "admin.password_change", context.userId, {});
    return { ok: true };
  });

type AdminCheckContext = { supabase: { rpc(fn: "is_admin"): PromiseLike<{ data: unknown }> } };

async function assertAdmin(context: AdminCheckContext) {
  const { data } = await context.supabase.rpc("is_admin");
  if (!data) throw new Error("Forbidden: this account does not have admin access");
  return true;
}

async function logAction(
  adminId: string,
  action: string,
  targetUserId: string | null,
  details: Record<string, string>,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("admin_audit_log")
    .insert({ admin_id: adminId, action, target_user_id: targetUserId, details });
}

/** Signed-in admin session details for the dashboard header. */
export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("phone, full_name, created_at")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      isAdmin: Boolean(isAdmin),
      userId: context.userId,
      phone: profile?.phone ?? "",
      fullName: profile?.full_name ?? null,
      since: profile?.created_at ?? null,
    };
  });

/** Dashboard overview counters. */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [users, blocked, pending, bets, wallets, txs] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_blocked", true),
      supabaseAdmin
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseAdmin.from("bets").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("wallets").select("balance"),
      supabaseAdmin
        .from("transactions")
        .select("kind, amount, status")
        .eq("status", "approved")
        .limit(1000),
    ]);

    const totalBalance = (wallets.data ?? []).reduce((s, w) => s + Number(w.balance), 0);
    const deposits = (txs.data ?? [])
      .filter((t) => t.kind === "deposit")
      .reduce((s, t) => s + Number(t.amount), 0);
    const withdrawals = (txs.data ?? [])
      .filter((t) => t.kind === "withdraw")
      .reduce((s, t) => s + Number(t.amount), 0);

    return {
      users: users.count ?? 0,
      blocked: blocked.count ?? 0,
      pendingRequests: pending.count ?? 0,
      bets: bets.count ?? 0,
      totalBalance,
      deposits,
      withdrawals,
    };
  });

/** Admin: list or search player accounts. */
export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ query: z.string().trim().max(60).default("") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let builder = supabaseAdmin
      .from("profiles")
      .select("id, phone, full_name, created_at, is_blocked, must_change_password")
      .order("created_at", { ascending: false })
      .limit(50);

    const q = data.query;
    if (q.length >= 3) {
      const digits = q.replace(/\D/g, "");
      if (/^[0-9a-f-]{36}$/i.test(q)) builder = builder.eq("id", q);
      else if (digits.length >= 4) builder = builder.ilike("phone", `%${digits}%`);
      else builder = builder.ilike("full_name", `%${q}%`);
    }

    const { data: rows, error } = await builder;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.id);
    const { data: wallets } = ids.length
      ? await supabaseAdmin.from("wallets").select("user_id, balance").in("user_id", ids)
      : { data: [] as { user_id: string; balance: number }[] };
    const balances = new Map((wallets ?? []).map((w) => [w.user_id, Number(w.balance)]));

    return (rows ?? []).map((r) => ({
      userId: r.id,
      phone: r.phone,
      name: r.full_name,
      blocked: r.is_blocked,
      mustChangePassword: r.must_change_password,
      balance: balances.get(r.id) ?? 0,
      registeredAt: r.created_at,
    }));
  });

/** Admin: block or reactivate a player account. */
export const adminSetUserBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), blocked: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_blocked: data.blocked })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logAction(context.userId, data.blocked ? "user.block" : "user.unblock", data.userId, {});
    return { ok: true };
  });

/** Admin: notifications management. */
export const adminListNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, title, body, link, is_active, published_at")
      .order("published_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCreateNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        title: z.string().trim().min(2).max(120),
        body: z.string().trim().min(2).max(1000),
        link: z.string().trim().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("notifications")
      .insert({ title: data.title, body: data.body, link: data.link || null, is_active: true });
    if (error) throw new Error(error.message);
    await logAction(context.userId, "notification.create", null, { title: data.title });
    return { ok: true };
  });

export const adminUpdateNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["activate", "deactivate", "delete"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "delete") {
      await supabaseAdmin.from("notification_reads").delete().eq("notification_id", data.id);
      const { error } = await supabaseAdmin.from("notifications").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_active: data.action === "activate" })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    await logAction(context.userId, `notification.${data.action}`, null, { id: data.id });
    return { ok: true };
  });

const SETTING_KEYS = [
  "deposit_upi_id",
  "support_whatsapp",
  "support_phone",
  "support_message",
  "min_deposit",
  "min_withdraw",
  "marquee_text",
] as const;

/** Admin: read the editable application settings. */
export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("app_settings").select("key, value");
    if (error) throw new Error(error.message);
    const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
    return SETTING_KEYS.map((key) => ({ key, value: map[key] ?? "" }));
  });

export const adminUpdateSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ key: z.enum(SETTING_KEYS), value: z.string().trim().max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    await logAction(context.userId, "settings.update", null, { key: data.key });
    return { ok: true };
  });

/** Admin: support queue — pending fund requests needing a human decision. */
export const adminSupportQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Include rows left mid-review by an interrupted approval so they stay
    // actionable instead of silently vanishing from the queue.
    const { data: rows, error } = await supabaseAdmin
      .from("transactions")
      .select("id, user_id, kind, amount, status, utr, note, created_at")
      .in("status", ["pending", "processing_approved", "processing_rejected"])
      .in("kind", ["deposit", "withdraw"])
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, phone").in("id", ids)
      : { data: [] as { id: string; phone: string }[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p.phone]));
    return (rows ?? []).map((r) => ({
      ...r,
      amount: Number(r.amount),
      phone: map.get(r.user_id) ?? "—",
    }));
  });

/** Admin: recent admin activity. */
export const adminAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_audit_log")
      .select("id, action, target_user_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Admin: quick backend health probe. */
export const adminSystemHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const started = Date.now();
    const { error } = await context.supabase
      .from("app_settings")
      .select("key", { count: "exact", head: true });
    const latency = Date.now() - started;
    return {
      database: error ? "down" : "operational",
      latencyMs: latency,
      checkedAt: new Date().toISOString(),
      message: error?.message ?? null,
    };
  });
