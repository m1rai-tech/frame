import { z } from 'zod';

const optionalText = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);
const optionalEmail = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.email().optional(),
);

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('Frame'),
  VITE_APP_URL: z.url().default('http://localhost:5173'),
  VITE_SUPABASE_URL: z.url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  VITE_USE_DEMO_CATALOG: z.enum(['true', 'false']).default('false'),
  VITE_LEGAL_ENTITY_NAME: optionalText,
  VITE_LEGAL_CONTACT_EMAIL: optionalEmail,
});

export const env = envSchema.parse(import.meta.env);
