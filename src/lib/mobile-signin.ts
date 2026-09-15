import { supabase } from "@/integrations/supabase/client";
import { syntheticEmail } from "@/lib/phone";

/**
 * Sign in with mobile number + password.
 * Internally converts the mobile number to the account's synthetic email.
 */
export async function signInWithMobile(rawPhone: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email: syntheticEmail(rawPhone),
    password,
  });
}
