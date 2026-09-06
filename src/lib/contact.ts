// Single source of truth for support contact details.
// Update these to change WhatsApp/Email everywhere in the app.
export const CONTACT = {
  whatsappNumber: "7597886713", // international format, no + or spaces
  whatsappMessage: "Hi! I need help with GD BOSS777.",
  supportHelpMessage: "Hello, I need help with my account.",
  email: "support@matka777.app",
  phone: "+917597886713",
  telegram: "https://t.me/+ABJTmMIkng04NWE9",
} as const;

export function whatsappHref(msg: string = CONTACT.whatsappMessage) {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}
