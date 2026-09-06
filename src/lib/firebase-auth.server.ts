/** Server-only helpers for Firebase phone-auth token exchange. */

export const FIREBASE_PROJECT_ID = "matka777-2d113";

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export function syntheticEmail(phone: string) {
  return `p${phone}@phone.matka777.app`;
}

type FirebaseIdTokenClaims = {
  aud?: string;
  iss?: string;
  exp?: number;
  sub?: string;
  firebase?: { sign_in_provider?: string };
};

/** Decodes the JWT payload without trusting it — claims are checked by the caller. */
function decodeClaims(idToken: string): FirebaseIdTokenClaims {
  const part = idToken.split(".")[1];
  if (!part) throw new Error("Phone verification failed. Please try again.");
  const padded = part.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return JSON.parse(json) as FirebaseIdTokenClaims;
}

/** Validates a Firebase ID token with Google and returns the verified phone number. */
export async function verifyFirebaseIdToken(idToken: string) {
  // Claim checks first: reject tokens minted for another Firebase project,
  // expired tokens, and tokens that did not come from the phone provider.
  const claims = decodeClaims(idToken);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const audienceOk = claims.aud === FIREBASE_PROJECT_ID;
  const issuerOk = claims.iss === `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  const notExpired = typeof claims.exp === "number" && claims.exp > nowSeconds;
  const phoneProvider = claims.firebase?.sign_in_provider === "phone";
  if (!audienceOk || !issuerOk || !notExpired || !phoneProvider) {
    throw new Error("Phone verification failed. Please try again.");
  }

  // Google then verifies the signature and that the account is still active.
  const apiKey = process.env["FIREBASE_API_KEY"] ?? "AIzaSyCVfzoZ4C8tT1xVhlaNh2T9D3GdmCcPjZk";
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!res.ok) throw new Error("Phone verification failed. Please try again.");
  const body = (await res.json()) as {
    users?: Array<{ phoneNumber?: string; localId?: string; disabled?: boolean }>;
  };
  const user = body.users?.[0];
  if (!user?.phoneNumber || user.disabled) {
    throw new Error("Phone verification failed. Please try again.");
  }
  if (claims.sub && user.localId && claims.sub !== user.localId) {
    throw new Error("Phone verification failed. Please try again.");
  }
  return { phoneNumber: user.phoneNumber, uid: user.localId ?? null };
}

/** Creates (if needed) the Cloud account for a verified phone and mints a session token. */
export async function mintSessionForPhone(rawPhone: string, firebaseUid: string | null) {
  const phone = normalizePhone(rawPhone);
  const email = syntheticEmail(phone);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { phone: `+${phone}`, firebase_uid: firebaseUid },
  });
  if (createError && !/already/i.test(createError.message)) {
    throw new Error(createError.message);
  }

  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !link?.properties?.hashed_token) {
    throw new Error(linkError?.message ?? "Could not start session");
  }

  return { tokenHash: link.properties.hashed_token, phone: `+${phone}` };
}
