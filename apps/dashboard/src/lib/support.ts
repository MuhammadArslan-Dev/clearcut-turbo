// ClearCutOff support contacts — one place for the dashboard.
// Same numbers the public site uses: phone on landing's contact page and
// JSON-LD, WhatsApp in landing's StartAuthForm / the shared login screen.
// ContactUsModal used to default to a placeholder "+919999999999", so every
// "Need help → Call / WhatsApp" in the dashboard dialled a fake number.
export const SUPPORT_PHONE = "+917210708599";
export const SUPPORT_WHATSAPP = "917404758398";

/** wa.me link with a prefilled message. */
export const supportWhatsAppUrl = (message: string) =>
  `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
