import {
  cleanProposalAttachmentArrays,
  planMaterialAttachmentMigration,
} from "../services/material-attachment-migration.service.js";
import { summarizeMaterialAttachmentMigration } from "../scripts/migrate-material-attachments.js";

describe("Supporting Material attachment migration", () => {
  it("removes archived records and keeps active records as status-free attachments", () => {
    expect(planMaterialAttachmentMigration({ id: "m-archived", status: "ARCHIVED" })).toEqual({
      action: "REMOVE",
      reason: "ARCHIVED",
    });
    expect(
      planMaterialAttachmentMigration({
        id: "m-active",
        status: "ACTIVE",
        metadata: { status: "DRAFT" },
      }),
    ).toEqual({ action: "CLEAN_STATUS" });
  });

  it("uses metadata ARCHIVED only when there is no top-level status", () => {
    expect(
      planMaterialAttachmentMigration({ id: "m-legacy-archived", metadata: { status: "ARCHIVED" } }),
    ).toEqual({ action: "REMOVE", reason: "ARCHIVED" });
    expect(
      planMaterialAttachmentMigration({
        id: "m-conflict",
        status: "ACTIVE",
        metadata: { status: "ARCHIVED" },
      }),
    ).toEqual({ action: "CLEAN_STATUS" });
  });

  it("summarizes cleanup idempotently without rejecting unknown legacy statuses", () => {
    const summary = summarizeMaterialAttachmentMigration([
      { id: "m-approved", metadata: { status: "APPROVED" } },
      { id: "m-archived", status: "ARCHIVED" },
      { id: "m-unknown", status: "WAITING" },
      { id: "m-current", metadata: { fileName: "reference.png" } },
    ]);

    expect(summary.cleanStatusIds).toEqual(["m-approved", "m-unknown"]);
    expect(summary.removeIds).toEqual(["m-archived"]);
    expect(summary.skipped).toBe(1);
  });

  it("cleans embedded Proposal files while preserving IDs and metadata", () => {
    expect(
      cleanProposalAttachmentArrays({
        manuscripts: [{ id: "mv-1", version: 1, status: "SUBMITTED", note: "Draft pages" }],
        materials: [
          { id: "mat-keep", status: "ACTIVE", metadata: { status: "DRAFT", fileKey: "keep" } },
          { id: "mat-remove", status: "ARCHIVED", fileKey: "remove" },
        ],
      }),
    ).toEqual({
      changed: true,
      manuscripts: [{ id: "mv-1", version: 1, note: "Draft pages" }],
      materials: [{ id: "mat-keep", metadata: { fileKey: "keep" } }],
    });
  });
});
