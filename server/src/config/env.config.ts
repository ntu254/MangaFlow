import "dotenv/config";

function parsePort(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? ""
};
