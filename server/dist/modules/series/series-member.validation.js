import mongoose from "mongoose";
import { z } from "zod";
const objectId = z.string().refine((value) => mongoose.isValidObjectId(value), {
    message: "Invalid id",
});
export const addSeriesMemberSchema = z.object({
    userId: objectId,
    role: z.enum(["ASSISTANT", "CO_MANGAKA", "EDITOR"]),
    accessScope: z.enum(["FULL", "TASK_ONLY"]),
});
export const updateSeriesMemberSchema = z.object({
    params: z.object({
        seriesId: objectId,
        memberId: objectId,
    }),
    body: z.object({
        /** Flow-03: pause or reactivate a member */
        status: z.enum(["ACTIVE", "PAUSED"]),
    }),
});
export const memberIdParamsSchema = z.object({
    seriesId: objectId,
    memberId: objectId,
});
//# sourceMappingURL=series-member.validation.js.map