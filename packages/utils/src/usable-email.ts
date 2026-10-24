// The email to send to Meta (`em`, advanced matching) and Amplitude
// (`email`) — CC-113. Comes from users.email, which Truecaller login fills
// when the profile has one, or the student enters on the account page.
//
// Trimmed and lower-cased (Meta's normalisation; the Pixel hashes it).
// Null when there is nothing worth sending: empty, not an email, or a
// placeholder. Meta asks for no `em` at all rather than a junk one.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// A gateway-generated address from the phone number (9876543210@…),
// test/no-reply addresses, and example domains.
const PLACEHOLDER = [/^\+?\d{6,}@/, /^test[^@]*@/, /^no-?reply@/, /@example\.(com|org|net)$/];

export function usableEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return null;
  if (PLACEHOLDER.some((pattern) => pattern.test(email))) return null;
  return email;
}
