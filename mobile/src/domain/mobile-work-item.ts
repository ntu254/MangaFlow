import { z } from "zod";

export const mobileWorkItemKindSchema = z.enum([
  "PROPOSAL_REVIEW",
  "CHAPTER_REVIEW",
  "COMMENT_REVIEW",
  "PUBLICATION",
  "BOARD_VOTE",
  "SESSION_FINALIZE",
  "BOARD_REVOTE",
  "AT_RISK",
]);

export const mobileWorkflowActionSchema = z.enum([
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
  "AT_RISK_DECIDE",
]);

export const mobileWorkflowActionDescriptorSchema = z.object({
  action: mobileWorkflowActionSchema,
  enabled: z.boolean(),
  disabledReason: z.string().min(1).nullable(),
  requiresConfirmation: z.boolean(),
  requiresReason: z.boolean(),
}).superRefine((value, context) => {
  if (value.enabled && value.disabledReason !== null) {
    context.addIssue({ code: "custom", message: "Enabled actions cannot have a disabled reason." });
  }
  if (!value.enabled && value.disabledReason === null) {
    context.addIssue({ code: "custom", message: "Disabled actions require a reason." });
  }
});

export const mobileWorkItemSchema = z.object({
  id: z.string(),
  kind: mobileWorkItemKindSchema,
  entityType: z.enum(["PROPOSAL", "CHAPTER", "COMMENT", "VOTING_SESSION", "RANKING"]),
  entityId: z.string(),
  status: z.string(),
  version: z.number().int().nonnegative().nullable(),
  title: z.string(),
  subtitle: z.string(),
  priority: z.object({
    level: z.enum(["URGENT", "HIGH", "NORMAL"]),
    reason: z.string(),
    dueAt: z.string().nullable(),
  }),
  blockers: z.array(z.object({
    code: z.string(),
    label: z.string(),
    detail: z.string(),
  })),
  actions: z.array(mobileWorkflowActionDescriptorSchema),
  summary: z.record(z.string(), z.unknown()),
});

export const mobileInboxSchema = z.object({
  role: z.enum(["EDITOR", "BOARD"]),
  generatedAt: z.string().datetime(),
  items: z.array(mobileWorkItemSchema),
});

export type MobileWorkItemKind = z.infer<typeof mobileWorkItemKindSchema>;
export type MobileWorkflowAction = z.infer<typeof mobileWorkflowActionSchema>;
export type MobileWorkflowActionDescriptor = z.infer<typeof mobileWorkflowActionDescriptorSchema>;
export type MobileWorkItem = z.infer<typeof mobileWorkItemSchema>;
export type MobileInbox = z.infer<typeof mobileInboxSchema>;
