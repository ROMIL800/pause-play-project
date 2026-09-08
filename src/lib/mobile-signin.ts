import { supabase } from "@/integrations/supabase/client";
import { loginPhone, syntheticEmail } from "@/lib/phone";

/**
 * Sign in with a mobile number + password.
 *
 * Every account is created with both a confirmed mobile number and a stable
 * synthetic email address, so the credential works whichever of the two
 * providers the backend project has enabled. We try the mobile credential
 * first and fall back to the email credential when that provider is turned
 * off on the host project — no provider-specific configuration required at
 * deploy time.
 */
export async function signInWithMobile(rawPhone: string, password: string) {
  const phoneResult = await supabase.auth.signInWithPassword({
    phone: loginPhone(rawPhone),
    password,
  });
  if (!phoneResult.error) return phoneResult;

  // The same account always has a stable synthetic email credential, so any
  // phone-side failure (provider disabled, unconfirmed number) retries there.
  const emailResult = await supabase.auth.signInWithPassword({
    email: syntheticEmail(rawPhone),
    password,
  });
  return emailResult.error ? phoneResult : emailResult;
}

