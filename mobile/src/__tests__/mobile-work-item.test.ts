import { mobileWorkItemSchema } from "../domain/mobile-work-item";

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
  it("accepts the backend work-item shape", () => {
    const item = mobileWorkItemSchema.parse(validProposalItem());
    expect(item.entityId).toBe("p-001");
    expect(item.version).toBe(3);
  });

  it.each([3.5, -1])("rejects an invalid item version of %s", (version) => {
    const value = validProposalItem();
    value.version = version;
    expect(() => mobileWorkItemSchema.parse(value)).toThrow();
  });

  it("accepts a null version for work with no versioned entity (e.g. a comment)", () => {
    const item = mobileWorkItemSchema.parse({ ...validProposalItem(), version: null });
    expect(item.version).toBeNull();
  });

  it("fails closed on an unknown backend action", () => {
    const value = validProposalItem();
    value.actions[0].action = "CLIENT_GUESSED_ACTION";
    expect(() => mobileWorkItemSchema.parse(value)).toThrow();
  });

  it("accepts RELEASE_CLAIM emitted by the Editor inbox", () => {
    const value = validProposalItem();
    value.actions[0] = { ...value.actions[0], action: "RELEASE_CLAIM" };

    expect(() => mobileWorkItemSchema.parse(value)).not.toThrow();
  });

  it("rejects a disabled action without a reason", () => {
    const value = validProposalItem();
    value.actions[0] = { ...value.actions[0], enabled: false, disabledReason: null };
    expect(() => mobileWorkItemSchema.parse(value)).toThrow();
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
