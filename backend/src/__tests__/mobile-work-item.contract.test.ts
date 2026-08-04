import { describe, expect, it } from "vitest";
import {
  mobileInboxSchema,
  mobileWorkflowActionSchema,
  mobileWorkItemKindSchema,
  mobileWorkItemSchema,
} from "../mobile/mobile-work-item.contract.js";

function validProposalItem(): any {
  return {
    id: "PROPOSAL_REVIEW:p-001",
    kind: "PROPOSAL_REVIEW",
    entityType: "PROPOSAL",
    entityId: "p-001",
    status: "PENDING_EDITOR",
    version: 3,
    title: "Neon District",
    subtitle: "Revision 2",
    priority: { level: "HIGH", reason: "Revision received", dueAt: null },
    blockers: [],
    actions: [{
      action: "CLAIM",
      enabled: true,
      disabledReason: null,
      requiresConfirmation: true,
      requiresReason: false,
    }],
    summary: {},
  };
}

describe("mobile work item contract", () => {
  it("defines the supported work-item kinds and workflow actions exactly", () => {
    expect(mobileWorkItemKindSchema.options).toEqual([
      "PROPOSAL_REVIEW",
      "CHAPTER_REVIEW",
      "COMMENT_REVIEW",
      "PUBLICATION",
      "BOARD_VOTE",
      "SESSION_FINALIZE",
      "BOARD_REVOTE",
      "AT_RISK",
    ]);
    expect(mobileWorkflowActionSchema.options).toEqual([
      "CLAIM",
      "RELEASE_CLAIM",
      "REQUEST_CHANGES",
      "REJECT",
      "FORWARD",
      "REQUEST_REVISION",
      "EDITOR_APPROVE",
      "COMMENT_CREATE",
      "COMMENT_REPLY",
      "COMMENT_RESOLVE",
      "COMMENT_REOPEN",
      "SCHEDULE",
      "POSTPONE",
      "PUBLISH",
      "VOTE",
      "SESSION_CREATE",
      "SESSION_UPDATE",
      "SESSION_CLOSE",
      "SESSION_CANCEL",
      "SESSION_FINALIZE",
      "TIE_RESOLVE",
      "AT_RISK_DECIDE",
    ]);
  });

  it("accepts a backend-owned proposal work item", () => {
    const item = mobileWorkItemSchema.parse(validProposalItem());
    expect(item.entityId).toBe("p-001");
    expect(item.version).toBe(3);
  });

  it.each([3.5, -1])("rejects an invalid item version of %s", (version) => {
    const invalid = validProposalItem();
    invalid.version = version;
    expect(() => mobileWorkItemSchema.parse(invalid)).toThrow();
  });

  it("accepts a null version for work with no versioned entity (e.g. a comment)", () => {
    const item = mobileWorkItemSchema.parse({ ...validProposalItem(), version: null });
    expect(item.version).toBeNull();
  });

  it("rejects an enabled action that also has a disabled reason", () => {
    const invalid = validProposalItem();
    invalid.actions[0] = { ...invalid.actions[0], enabled: true, disabledReason: "Not assigned" };
    expect(() => mobileWorkItemSchema.parse(invalid)).toThrow();
  });

  it("requires a non-empty reason for disabled actions", () => {
    const invalid = validProposalItem();
    invalid.actions[0] = { ...invalid.actions[0], enabled: false, disabledReason: "" };
    expect(() => mobileWorkItemSchema.parse(invalid)).toThrow();
  });

  it("validates a versioned Editor inbox", () => {
    expect(mobileInboxSchema.parse({
      role: "EDITOR",
      generatedAt: "2026-07-30T00:00:00.000Z",
      items: [validProposalItem()],
    }).items).toHaveLength(1);
  });

  it("rejects publication work without explicit series and chapter context", () => {
    const publication = {
      ...validProposalItem(),
      kind: "PUBLICATION",
      entityType: "CHAPTER",
      entityId: "ch-4",
      title: "Echoes",
    };

    expect(() => mobileWorkItemSchema.parse(publication)).toThrow();
  });

  it("rejects publication context for a different chapter", () => {
    const publication = {
      ...validProposalItem(),
      kind: "PUBLICATION",
      entityType: "CHAPTER",
      entityId: "ch-4",
      title: "Echoes",
      chapterContext: {
        seriesId: "series-1",
        seriesTitle: "Berserk: Lost Chapters",
        chapterId: "ch-5",
        chapterNumber: 5,
        chapterTitle: "Old Wound",
      },
    };

    expect(() => mobileWorkItemSchema.parse(publication)).toThrow();
  });
});
