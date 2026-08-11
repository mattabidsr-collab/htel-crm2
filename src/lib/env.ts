import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().min(1).optional(),
  APP_ENCRYPTION_KEY: z.string().min(32),
  STORAGE_ENDPOINT: z.string().min(1),
  STORAGE_REGION: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  LOG_LEVEL: z.string().default("info"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Optional integration credentials. Absent in dev/test — those paths
  // fall back to mock adapters (or, for ConnectUC, simply reject inbound
  // webhooks) so the surrounding pipeline stays testable.

  // Shared secret ConnectUC/Activepieces webhook calls must present via
  // `Authorization: Bearer <secret>`. There's no adapter to mock here —
  // it's a push-based webhook, not a client we call out to — so unset
  // means "reject all webhook calls" rather than "use mock data."
  CONNECTUC_WEBHOOK_SECRET: z.string().optional(),

  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().optional(),

  VISION_API_BASE_URL: z.string().optional(),
  VISION_API_TOKEN: z.string().optional(),
  VISION_API_USERNAME: z.string().optional(),
  VISION_API_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
