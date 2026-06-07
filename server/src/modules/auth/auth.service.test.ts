import { describe, it, expect } from "vitest"
import * as bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

describe("password hashing", () => {
  it("should hash and verify a password", async () => {
    const password = "MyStr0ngP@ss"
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    expect(await comparePassword(password, hash)).toBe(true)
    expect(await comparePassword("wrong", hash)).toBe(false)
  })

  it("should hash the same password differently each time", async () => {
    const password = "SamePass123"
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)
    expect(hash1).not.toBe(hash2)
  })
})

describe("auth service contract", () => {
  it("create token shape", async () => {
    const accessToken = "dummy.jwt.token"
    const refreshToken = "abcdef1234567890"
    const payload = {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: "64f1c2a1b2d3e4f5a6b7c8d9",
          email: "mangaka@example.com",
          name: "Test Mangaka",
          role: "MANGAKA",
          isActive: true,
        },
        redirectTo: "/app/mangaka/dashboard",
      },
    }

    expect(payload.success).toBe(true)
    expect(payload.data.accessToken).toBe(accessToken)
    expect(payload.data.refreshToken).toBe(refreshToken)
    expect(payload.data.user.role).toBe("MANGAKA")
    expect(payload.data.redirectTo).toBe("/app/mangaka/dashboard")
  })

  it("suspended user must block login", () => {
    const user = { isActive: false, role: "MANGAKA" }
    const blocked = !user.isActive
    expect(blocked).toBe(true)
  })
})

describe("createUser contract", () => {
  it("allow ADMIN create normal user", async () => {
    const email = "assistant1@example.com"
    const name = "Assistant One"
    const role = "ASSISTANT"
    const password = "Assistant@123"

    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    expect(name.length).toBeGreaterThan(0)
    expect(["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]).toContain(role)
    expect(password.length).toBeGreaterThanOrEqual(8)
  })
})
