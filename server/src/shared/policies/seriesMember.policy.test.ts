import { describe, it, expect } from "vitest"
import { isActiveMember, ACTIVE_MEMBER_QUERY } from "./seriesMember.policy.js"

describe("isActiveMember (Flow-03 dual check)", () => {
  it("returns false for null", () => {
    expect(isActiveMember(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isActiveMember(undefined)).toBe(false)
  })

  it("status=ACTIVE is true regardless of isActive", () => {
    expect(isActiveMember({ status: "ACTIVE", isActive: false })).toBe(true)
    expect(isActiveMember({ status: "ACTIVE", isActive: true })).toBe(true)
  })

  it("status=PAUSED is false even if isActive=true", () => {
    expect(isActiveMember({ status: "PAUSED", isActive: true })).toBe(false)
  })

  it("status=REMOVED is false", () => {
    expect(isActiveMember({ status: "REMOVED", isActive: true })).toBe(false)
  })

  it("status=INVITED is false", () => {
    expect(isActiveMember({ status: "INVITED", isActive: true })).toBe(false)
  })

  it("legacy: no status, isActive=true is true", () => {
    expect(isActiveMember({ isActive: true } as any)).toBe(true)
  })

  it("legacy: no status, isActive=false is false", () => {
    expect(isActiveMember({ isActive: false } as any)).toBe(false)
  })
})

describe("ACTIVE_MEMBER_QUERY", () => {
  it("is a $or matching new status or legacy isActive", () => {
    expect(ACTIVE_MEMBER_QUERY).toEqual({
      $or: [
        { status: "ACTIVE" },
        { status: { $exists: false }, isActive: true },
      ],
    })
  })
})
