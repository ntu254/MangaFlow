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
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  s3Provider: process.env.S3_PROVIDER ?? "local", // 'cloudflare-r2', 'minio', 'local'
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3Bucket: process.env.S3_BUCKET ?? "mangaflow",
  s3AccessKey: process.env.S3_ACCESS_KEY ?? "",
  s3SecretKey: process.env.S3_SECRET_KEY ?? "",
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true"
};
