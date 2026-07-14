import { z } from "zod";

export const boardProposalVoteSchema = z
  .object({
    voteDecision: z.enum(["APPROVE", "REJECT", "ABSTAIN"]).optional(),
    value: z.enum(["APPROVE", "REJECT", "ABSTAIN"]).optional(),
    decision: z.enum(["APPROVE", "REJECT", "ABSTAIN"]).optional(),
    comment: z.string().max(5000).optional(),
    note: z.string().max(5000).optional(),
    sessionId: z.string().optional(),
  })
  .strict();

export const boardProposalFinalizationSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    note: z.string().max(5000).optional(),
    publicationType: z.enum(["WEEKLY", "MONTHLY"]).optional(),
    tantouEditorId: z.string().optional(),
    editorId: z.string().optional(),
  })
  .strict();
