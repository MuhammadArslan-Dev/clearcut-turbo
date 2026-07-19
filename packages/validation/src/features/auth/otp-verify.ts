import { z } from "zod";

import { otpSchema } from "../../common/otp";
import { indianMobileSchema } from "../../common/phone";

/** Mirrors the real payload sent by `authApi.verifyOtp` in apps/landing. */
export const otpVerifySchema = z.object({
  phone: indianMobileSchema,
  otp: otpSchema,
});

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
