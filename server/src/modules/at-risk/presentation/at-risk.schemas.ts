import { z } from "zod";

export const atRiskReportSchema = z
  .object({
    rankingSummary: z.string().min(1).max(5000),
    recommendation: z.string().min(1).max(100),
    notes: z.string().max(5000).optional(),
  })
  .strict();

export const atRiskDecisionSchema = z
  .object({
    decision: z.enum(["CONTINUE", "RESCHEDULE", "HIATUS", "CANCELLED"]),
    publicationType: z.enum(["WEEKLY", "MONTHLY"]).optional(),
    note: z.string().max(5000).optional(),
  })
  .strict();
