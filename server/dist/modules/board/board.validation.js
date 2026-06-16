import mongoose from "mongoose";
import { z } from "zod";
export const seriesIdParamsSchema = z.object({
    seriesId: z.string().refine((value) => mongoose.isValidObjectId(value), { message: "Invalid series id" }),
});
export const boardVoteBodySchema = z.object({
    value: z.enum(["APPROVE", "REJECT", "NEEDS_REVISION"]),
    note: z.string().trim().max(2000).optional(),
});
export const boardFinalizeBodySchema = z.object({
    decision: z.enum(["APPROVED", "REJECTED", "NEEDS_REVISION"]).optional(),
    publicationType: z.enum(["WEEKLY", "MONTHLY"]).optional(),
    note: z.string().trim().max(2000).optional(),
}).refine((value) => value.decision !== "APPROVED" || Boolean(value.publicationType), {
    message: "Publication type is required when approving a series",
    path: ["publicationType"],
});
export const boardTieBreakBodySchema = z.object({
    value: z.enum(["APPROVE", "REJECT", "NEEDS_REVISION"]),
    publicationType: z.enum(["WEEKLY", "MONTHLY"]).optional(),
    note: z.string().trim().max(2000).optional(),
}).refine((value) => value.value !== "APPROVE" || Boolean(value.publicationType), {
    message: "Publication type is required when approving a series",
    path: ["publicationType"],
});
export const atRiskDecisionBodySchema = z.object({
    decision: z.enum(["CONTINUE", "WARNING", "REQUEST_IMPROVEMENT_PLAN", "CANCEL"]),
    note: z.string().max(2000).optional(),
});
//# sourceMappingURL=board.validation.js.map