import { z } from "zod";

/**
 * 4-6 numeric digits — matches `OTPInput`'s length clamp
 * (`Math.max(4, Math.min(6, length))`, default 4).
 */
export const otpSchema = z
  .string()
  .regex(/^\d{4,6}$/, "Enter the code sent to your phone");

export type Otp = z.infer<typeof otpSchema>;
