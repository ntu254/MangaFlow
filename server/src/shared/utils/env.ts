import "dotenv/config"

interface RawEnv {
  [key: string]: string | undefined
}

function readEnv(source: RawEnv, key: string, fallback?: string): string {
  const value = source[key] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optionalEnv(source: RawEnv, key: string): string | undefined {
  const value = source[key]
  return value && value.trim() ? value : undefined
}

function requireProductionEnv(source: RawEnv, key: string): string {
  const value = optionalEnv(source, key)
  if (!value) {
    throw new Error(`Missing required production environment variable: ${key}`)
  }
  return value
}

function requireProductionSecret(source: RawEnv, key: string): string {
  const value = requireProductionEnv(source, key)
  if (value.startsWith("dev-") || value.includes("change-in-production") || value.length < 32) {
    throw new Error(`Production environment variable ${key} must be a strong secret`)
  }
  return value
}

export function buildConfig(source: RawEnv = process.env) {
  const nodeEnv = readEnv(source, "NODE_ENV", "development")
  const isProduction = nodeEnv === "production"

  const mongoUri = isProduction
    ? requireProductionEnv(source, "MONGO_URI")
    : readEnv(source, "MONGO_URI", "mongodb://localhost:27017/mangaflow")

  const jwtSecret = isProduction
    ? requireProductionSecret(source, "JWT_ACCESS_SECRET")
    : readEnv(source, "JWT_ACCESS_SECRET", optionalEnv(source, "JWT_SECRET") ?? "dev-jwt-secret-change-in-production")

  const jwtRefreshSecret = isProduction
    ? requireProductionSecret(source, "JWT_REFRESH_SECRET")
    : readEnv(source, "JWT_REFRESH_SECRET", optionalEnv(source, "JWT_REFRESH_SECRET_LEGACY") ?? "dev-refresh-secret-change-in-production")

  const r2Region = readEnv(source, "R2_REGION", "auto")
  const r2Endpoint = isProduction
    ? requireProductionEnv(source, "R2_ENDPOINT")
    : readEnv(source, "R2_ENDPOINT", "https://placeholder.r2.cloudflarestorage.com")
  const r2AccessKeyId = isProduction
    ? requireProductionEnv(source, "R2_ACCESS_KEY_ID")
    : readEnv(source, "R2_ACCESS_KEY_ID", "placeholder-access-key")
  const r2SecretAccessKey = isProduction
    ? requireProductionEnv(source, "R2_SECRET_ACCESS_KEY")
    : readEnv(source, "R2_SECRET_ACCESS_KEY", "placeholder-secret-key")
  const r2Bucket = isProduction
    ? requireProductionEnv(source, "R2_BUCKET")
    : readEnv(source, "R2_BUCKET", "mangaflow")

  return {
    port: parseInt(readEnv(source, "PORT", "3001"), 10),
    clientUrl: readEnv(source, "CLIENT_URL", "http://localhost:5173"),
    aiServiceUrl: readEnv(source, "AI_SERVICE_URL", "http://127.0.0.1:8000"),
    mongoUri,
    jwtSecret,
    jwtRefreshSecret,
    jwtExpiresIn: readEnv(source, "JWT_EXPIRES_IN", "15m"),
    jwtRefreshExpiresIn: readEnv(source, "JWT_REFRESH_EXPIRES_IN", "7d"),
    nodeEnv,
    isProduction,
    r2Region,
    r2Endpoint,
    r2AccessKeyId,
    r2SecretAccessKey,
    r2Bucket,
    adminSeed: {
      email: optionalEnv(source, "ADMIN_EMAIL"),
      password: optionalEnv(source, "ADMIN_PASSWORD"),
      fullName: optionalEnv(source, "ADMIN_FULL_NAME") ?? "System Admin",
    },
  }
}

export const config = buildConfig()

