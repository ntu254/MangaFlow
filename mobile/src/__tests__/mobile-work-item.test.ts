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
    expect(mobileWorkItemSchema.parse(validProposalItem()).entityId).toBe("p-001");
  });

  it("fails closed on an unknown backend action", () => {
    const value = validProposalItem();
    value.actions[0].action = "CLIENT_GUESSED_ACTION";
    expect(() => mobileWorkItemSchema.parse(value)).toThrow();
  });

  it("rejects a disabled action without a reason", () => {
    const value = validProposalItem();
    value.actions[0] = { ...value.actions[0], enabled: false, disabledReason: null };
    expect(() => mobileWorkItemSchema.parse(value)).toThrow();
  });
});
