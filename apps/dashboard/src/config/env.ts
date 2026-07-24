// config/env.ts
import { z } from 'zod';

// Server-side env (no NEXT_PUBLIC prefix)
const serverSchema = z.object({
  LARAVEL_API_URL: z.string().url(),
});

export const serverEnv = serverSchema.parse({
  LARAVEL_API_URL: process.env.LARAVEL_API_URL,
});

// Client-side env (must be prefixed with NEXT_PUBLIC_)
const clientSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
});

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});