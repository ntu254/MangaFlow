import { describe, expect, it } from "vitest";
import { planCanonicalCommentMigration } from "../services/canonical-comment-migration.service.js";
import { planRegionLockMigration } from "../services/region-lock-migration.service.js";

describe("legacy migration planners", () => {
  it("canonicalizes legacy comment fields and FIXED status", () => {
    expect(
      planCanonicalCommentMigration({ id: "comment-1", blocking: true, status: "FIXED" }),
    ).toEqual({
      action: "MIGRATE",
      set: { isBlocking: true, status: "ADDRESSED" },
      unset: { blocking: "" },
    });
  });

  it("removes a false legacy blocking field without changing canonical data", () => {
    expect(planCanonicalCommentMigration({ id: "comment-2", blocking: false })).toEqual({
      action: "MIGRATE",
      set: {},
      unset: { blocking: "" },
    });
  });

  it("is idempotent after comment canonicalization", () => {
    expect(
      planCanonicalCommentMigration({ id: "comment-3", isBlocking: true, status: "ADDRESSED" }),
    ).toEqual({ action: "SKIP", set: {}, unset: {} });
  });

  it("maps RELEASED to UNLOCKED and skips canonical values", () => {
    expect(planRegionLockMigration({ lockStatus: "RELEASED" })).toEqual({
      action: "MIGRATE",
      set: { lockStatus: "UNLOCKED" },
    });
    expect(planRegionLockMigration({ lockStatus: "UNLOCKED" })).toEqual({
      action: "SKIP",
      set: {},
    });
  });

  it("does not treat unknown legacy values as migration candidates", () => {
    expect(planCanonicalCommentMigration({ status: "UNKNOWN" })).toEqual({
      action: "SKIP",
      set: {},
      unset: {},
    });
    expect(planRegionLockMigration({ lockStatus: "UNKNOWN" })).toEqual({
      action: "SKIP",
      set: {},
    });
  });
});
