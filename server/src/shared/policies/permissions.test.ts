import { describe, it, expect } from "vitest"
import { can, __PERMISSION_MATRIX } from "./permissions.js"
import type { UserRole } from "../../modules/auth/auth.types.js"

const ALL_ROLES: UserRole[] = ["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]

describe("permission matrix", () => {
  it("ADMIN_CONFIG_MANAGE — only ADMIN", () => {
    expect(can("ADMIN", "ADMIN_CONFIG_MANAGE")).toBe(true)
    for (const role of ALL_ROLES.filter((r) => r !== "ADMIN")) {
      expect(can(role, "ADMIN_CONFIG_MANAGE")).toBe(false)
    }
  })

  it("COMMENT_CREATE — production team only, BOARD excluded", () => {
    expect(can("MANGAKA", "COMMENT_CREATE")).toBe(true)
    expect(can("EDITOR", "COMMENT_CREATE")).toBe(true)
    expect(can("ASSISTANT", "COMMENT_CREATE")).toBe(true)
    expect(can("BOARD", "COMMENT_CREATE")).toBe(false)
    expect(can("ADMIN", "COMMENT_CREATE")).toBe(false)
  })

  it("COMMENT_MARK_FIXED — Assistant only", () => {
    expect(can("ASSISTANT", "COMMENT_MARK_FIXED")).toBe(true)
    for (const role of ALL_ROLES.filter((r) => r !== "ASSISTANT")) {
      expect(can(role, "COMMENT_MARK_FIXED")).toBe(false)
    }
  })

  it("COMMENT_VERIFY_FIX — Mangaka only", () => {
    expect(can("MANGAKA", "COMMENT_VERIFY_FIX")).toBe(true)
    for (const role of ALL_ROLES.filter((r) => r !== "MANGAKA")) {
      expect(can(role, "COMMENT_VERIFY_FIX")).toBe(false)
    }
  })

  it("COMMENT_RESOLVE — Editor only", () => {
    expect(can("EDITOR", "COMMENT_RESOLVE")).toBe(true)
    for (const role of ALL_ROLES.filter((r) => r !== "EDITOR")) {
      expect(can(role, "COMMENT_RESOLVE")).toBe(false)
    }
  })

  it("COMMENT_REOPEN — Editor or Mangaka", () => {
    expect(can("EDITOR", "COMMENT_REOPEN")).toBe(true)
    expect(can("MANGAKA", "COMMENT_REOPEN")).toBe(true)
    expect(can("ASSISTANT", "COMMENT_REOPEN")).toBe(false)
    expect(can("BOARD", "COMMENT_REOPEN")).toBe(false)
    expect(can("ADMIN", "COMMENT_REOPEN")).toBe(false)
  })

  it("EARNING_CALCULATE — Assistant is BLOCKED (Flow-11)", () => {
    expect(can("ASSISTANT", "EARNING_CALCULATE")).toBe(false)
    expect(can("MANGAKA", "EARNING_CALCULATE")).toBe(true)
    expect(can("EDITOR", "EARNING_CALCULATE")).toBe(true)
    expect(can("ADMIN", "EARNING_CALCULATE")).toBe(true)
  })

  it("EARNING_CONFIRM — Admin and Editor only (MVP, no Finance)", () => {
    expect(can("ADMIN", "EARNING_CONFIRM")).toBe(true)
    expect(can("EDITOR", "EARNING_CONFIRM")).toBe(true)
    expect(can("MANGAKA", "EARNING_CONFIRM")).toBe(false)
    expect(can("ASSISTANT", "EARNING_CONFIRM")).toBe(false)
    expect(can("BOARD", "EARNING_CONFIRM")).toBe(false)
  })

  it("EARNING_MARK_PAID — Admin only", () => {
    expect(can("ADMIN", "EARNING_MARK_PAID")).toBe(true)
    for (const role of ALL_ROLES.filter((r) => r !== "ADMIN")) {
      expect(can(role, "EARNING_MARK_PAID")).toBe(false)
    }
  })

  it("every permission lists at least one role", () => {
    for (const [perm, roles] of Object.entries(__PERMISSION_MATRIX)) {
      expect(roles.length, `${perm} must have at least one role`).toBeGreaterThan(0)
    }
  })
})
