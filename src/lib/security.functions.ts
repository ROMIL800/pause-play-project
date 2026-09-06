import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

const identifierSchema = z.object({
  identifier: z.string().trim().min(3).max(80),
});

/**
 * Brute-force guard. Counts failed logins for one mobile number inside a
 * rolling window and blocks further attempts once the limit is reached.
 * The attempt log lives in a table only the privileged server role can read.
 */
export const checkLoginThrottle = createServerFn({ method: "POST" })
  .inputValidator((input) => identifierSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const { data: rows } = await supabaseAdmin
      .from("login_attempts")
      .select("created_at, success")
      .eq("identifier", data.identifier)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);

    const failures: { created_at: string }[] = [];
    for (const row of rows ?? []) {
      if (row.success) break; // a success clears the streak
      failures.push(row);
    }

    if (failures.length >= MAX_FAILURES) {
      const oldest = new Date(failures[failures.length - 1]!.created_at).getTime();
      const unlockAt = oldest + WINDOW_MINUTES * 60 * 1000;
      const minutes = Math.max(1, Math.ceil((unlockAt - Date.now()) / 60000));
      return { allowed: false as const, minutes };
    }
    return { allowed: true as const, remaining: MAX_FAILURES - failures.length };
  });

/** Record the outcome of a login attempt (called after every sign-in try). */
export const recordLoginAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => identifierSchema.extend({ success: z.boolean() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("login_attempts")
      .insert({ identifier: data.identifier, success: data.success });
    return { ok: true };
  });
