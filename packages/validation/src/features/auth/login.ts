import { z } from "zod";

import { indianMobileSchema } from "../../common/phone";

/** Mirrors the real payload sent by `authApi.loginUser` in apps/landing. */
export const loginSchema = z.object({
  phone: indianMobileSchema,
  user_id: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
