import { z } from "zod";

// Re-exported from the zod-free module so this import path keeps working.
// See phone-regex.ts for why the constant lives there.
export { INDIAN_MOBILE_REGEX } from "./phone-regex";
import { INDIAN_MOBILE_REGEX } from "./phone-regex";

export const indianMobileSchema = z
  .string()
  .regex(INDIAN_MOBILE_REGEX, "Enter a valid 10-digit mobile number");

export type IndianMobile = z.infer<typeof indianMobileSchema>;
