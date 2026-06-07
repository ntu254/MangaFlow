import "dotenv/config"

function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const config = {
  port: parseInt(env("PORT", "3001"), 10),
  mongoUri: env("MONGO_URI", "mongodb://localhost:27017/mangaflow"),
  jwtSecret: env("JWT_SECRET", "dev-jwt-secret-change-in-production"),
  jwtRefreshSecret: env("JWT_REFRESH_SECRET", "dev-refresh-secret-change-in-production"),
  jwtExpiresIn: env("JWT_EXPIRES_IN", "15m"),
  jwtRefreshExpiresIn: env("JWT_REFRESH_EXPIRES_IN", "7d"),
  nodeEnv: env("NODE_ENV", "development"),
}
