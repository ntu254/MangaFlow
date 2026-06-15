import { describe, expect, it } from "vitest"
import { buildConfig } from "./env.js"

const strongAccessSecret = "access-secret-with-at-least-thirty-two-characters"
const strongRefreshSecret = "refresh-secret-with-at-least-thirty-two-characters"

function productionEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: "production",
    MONGO_URI: "mongodb://production/mangaflow",
    JWT_ACCESS_SECRET: strongAccessSecret,
    JWT_REFRESH_SECRET: strongRefreshSecret,
    R2_ENDPOINT: "https://example.r2.cloudflarestorage.com",
    R2_ACCESS_KEY_ID: "access-key",
    R2_SECRET_ACCESS_KEY: "secret-key",
    R2_BUCKET: "mangaflow",
    ...overrides,
  }
}

describe("buildConfig", () => {
  it("allows safe development defaults", () => {
    const result = buildConfig({ NODE_ENV: "development" })
    expect(result.mongoUri).toBe("mongodb://localhost:27017/mangaflow")
    expect(result.isProduction).toBe(false)
  })

  it("rejects missing production auth secrets", () => {
    expect(() => buildConfig(productionEnv({ JWT_ACCESS_SECRET: undefined }))).toThrow(
      "JWT_ACCESS_SECRET",
    )
  })

  it("rejects weak production auth secrets", () => {
    expect(() => buildConfig(productionEnv({ JWT_ACCESS_SECRET: "short-secret" }))).toThrow(
      "strong secret",
    )
  })

  it("requires production storage configuration", () => {
    expect(() => buildConfig(productionEnv({ R2_BUCKET: undefined }))).toThrow("R2_BUCKET")
  })
})
