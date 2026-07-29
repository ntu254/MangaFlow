import "dotenv/config";
import { z } from "zod";

const rawEnv = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    MONGO_URI: z.string().optional().default(""),
    JWT_ACCESS_SECRET: z.string().optional().default("dev-access-secret-change-me"),
    JWT_REFRESH_SECRET: z.string().optional().default("dev-refresh-secret-change-me"),
    JWT_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    CLIENT_URL: z.string().optional().default("http://localhost:5173"),
    AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),
    OUTBOX_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
    OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().max(250).default(25),
    OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().max(20).default(5),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(10_000).default(20),
    R2_REGION: z.string().optional().default("auto"),
    R2_ENDPOINT: z.string().optional().default(""),
    R2_ACCESS_KEY_ID: z.string().optional().default(""),
    R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
    R2_BUCKET: z.string().optional().default(""),
    R2_PUBLIC_URL: z.string().optional().default(""),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    ADMIN_FULL_NAME: z.string().optional(),
  })
  .parse(process.env);

if (rawEnv.NODE_ENV === "production") {
  const missing = [
    rawEnv.MONGO_URI ? "" : "MONGO_URI",
    rawEnv.JWT_ACCESS_SECRET === "dev-access-secret-change-me" ? "JWT_ACCESS_SECRET" : "",
    rawEnv.JWT_REFRESH_SECRET === "dev-refresh-secret-change-me" ? "JWT_REFRESH_SECRET" : "",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing production backend environment: ${missing.join(", ")}`);
  }
}

export const env = rawEnv;
