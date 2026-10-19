import { z } from 'zod';

/**
 * Client-accessible environment variables schema.
 * All client variables must be prefixed with NEXT_PUBLIC_.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional().or(z.literal('')),
});

/**
 * Server-only environment variables schema.
 */
export const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().optional(),
  INTERNAL_API_URL: z.string().url().optional().or(z.literal('')),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const env = serverEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  INTERNAL_API_URL: process.env.INTERNAL_API_URL,
});
