import {
  planMaterialStatusMigration,
  type MaterialStatusMigrationPlan,
} from "../services/material-status.service.js";
import { summarizeMaterialStatusMigration } from "../scripts/migrate-material-status.js";

describe("material status migration", () => {
  it("promotes valid metadata statuses and is idempotent after cleanup", () => {
    const legacy = { id: "m-active", status: "DRAFT", metadata: { status: "ACTIVE" } };
    expect(planMaterialStatusMigration(legacy)).toEqual({ action: "MIGRATE", status: "ACTIVE" });

    const migrated = { id: legacy.id, status: "ACTIVE", metadata: {} };
    expect(planMaterialStatusMigration(migrated)).toEqual({
      action: "SKIP",
      reason: "TOP_LEVEL_STATUS_CANONICAL",
    });
    expect(summarizeMaterialStatusMigration([legacy]).candidates).toEqual([
      { id: "m-active", status: "ACTIVE" },
    ]);
  });

  it("migrates APPROVED, skips canonical records, and reports invalid values", () => {
    const summary = summarizeMaterialStatusMigration([
      { id: "m-approved", metadata: { status: "APPROVED" } },
      { id: "m-canonical", status: "ACTIVE", metadata: { status: "DRAFT" } },
      { id: "m-invalid", metadata: { status: "WAITING" } },
    ]);

    expect(summary.candidates).toEqual([{ id: "m-approved", status: "APPROVED" }]);
    expect(summary.skipped).toBe(1);
    expect(summary.invalid).toEqual([
      { id: "m-invalid", source: "METADATA", value: "WAITING" },
    ]);
  });

  it("reports an invalid top-level status instead of overwriting it", () => {
    const plan: MaterialStatusMigrationPlan = planMaterialStatusMigration({
      id: "m-invalid-top-level",
      status: "WAITING",
      metadata: { status: "ACTIVE" },
    });
    expect(plan).toEqual({ action: "INVALID", source: "TOP_LEVEL", value: "WAITING" });
  });
});
