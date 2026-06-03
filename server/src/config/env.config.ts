import "dotenv/config";

function parsePort(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCorsOrigins(value: string | undefined) {
  return (value ?? "http://localhost:5173")
    .split(",")
    .map(origin => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

const storageProvider = process.env.NODE_ENV === "test"
  ? "local"
  : (process.env.STORAGE_PROVIDER ?? process.env.S3_PROVIDER ?? "local");

let s3Provider = "local";
let s3Endpoint = "";
let s3Region = "auto";
let s3Bucket = "mangaflow";
let s3AccessKey = "";
let s3SecretKey = "";
let s3ForcePathStyle = false;

if (storageProvider === "r2" || storageProvider === "cloudflare-r2") {
  s3Provider = "cloudflare-r2";
  s3AccessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "";
  s3SecretKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "";
  s3Bucket = process.env.CLOUDFLARE_R2_BUCKET ?? "mangaflow-storage";
  s3Region = "auto";
  s3ForcePathStyle = false;
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? "";
  if (accountId) {
    s3Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  }
} else if (storageProvider === "minio") {
  s3Provider = "minio";
  s3AccessKey = process.env.MINIO_ACCESS_KEY ?? "";
  s3SecretKey = process.env.MINIO_SECRET_KEY ?? "";
  s3Bucket = process.env.MINIO_BUCKET ?? "mangaflow-local";
  s3Endpoint = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
  s3Region = "us-east-1";
  s3ForcePathStyle = true;
} else {
  // Check if direct S3 variables are set for compatibility
  s3Provider = process.env.S3_PROVIDER ?? "local";
  s3Endpoint = process.env.S3_ENDPOINT ?? "";
  s3Region = process.env.S3_REGION ?? "auto";
  s3Bucket = process.env.S3_BUCKET ?? "mangaflow";
  s3AccessKey = process.env.S3_ACCESS_KEY ?? "";
  s3SecretKey = process.env.S3_SECRET_KEY ?? "";
  s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT, 5000),
  corsOrigin: corsOrigins[0],
  corsOrigins,
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://localhost:8000",
  s3Provider,
  s3Endpoint,
  s3Region,
  s3Bucket,
  s3AccessKey,
  s3SecretKey,
  s3ForcePathStyle
};



