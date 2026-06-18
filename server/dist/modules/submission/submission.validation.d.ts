import { z } from "zod";
export declare const taskIdParamsSchema: z.ZodObject<{
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
}, {
    taskId: string;
}>;
export declare const submissionIdParamsSchema: z.ZodObject<{
    submissionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    submissionId: string;
}, {
    submissionId: string;
}>;
export declare const createSubmissionBodySchema: z.ZodEffects<z.ZodObject<{
    resultText: z.ZodOptional<z.ZodString>;
    fileAssetId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fileAssetId?: string | undefined;
    resultText?: string | undefined;
}, {
    fileAssetId?: string | undefined;
    resultText?: string | undefined;
}>, {
    fileAssetId?: string | undefined;
    resultText?: string | undefined;
}, {
    fileAssetId?: string | undefined;
    resultText?: string | undefined;
}>;
export declare const reviewActionBodySchema: z.ZodObject<{
    reviewerNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reviewerNote?: string | undefined;
}, {
    reviewerNote?: string | undefined;
}>;
export declare const getTaskUploadUrlBodySchema: z.ZodObject<{
    originalName: z.ZodString;
    contentType: z.ZodString;
    size: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    originalName: string;
    size: number;
    contentType: string;
}, {
    originalName: string;
    size: number;
    contentType: string;
}>;
//# sourceMappingURL=submission.validation.d.ts.map