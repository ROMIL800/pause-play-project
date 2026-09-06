/** Shared, browser-safe phone helpers. Keep in sync with firebase-auth.server.ts. */

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * Deterministic login address for a mobile number. Cloud Auth requires an
 * email credential, so the phone maps to a stable synthetic address; the
 * password itself is stored only as a hash by Cloud Auth.
 */
export function syntheticEmail(phone: string) {
  return `p${normalizePhone(phone)}@phone.matka777.app`;
}

export function isValidMobile(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
}

/** E.164 mobile used as the sign-in credential (no email involved). */
export function loginPhone(raw: string) {
  return `+${normalizePhone(raw)}`;
}
