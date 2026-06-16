import { z } from "zod";
export declare const createSeriesSchema: z.ZodObject<{
    title: z.ZodString;
    synopsis: z.ZodString;
    logline: z.ZodOptional<z.ZodString>;
    premise: z.ZodOptional<z.ZodString>;
    characters: z.ZodOptional<z.ZodString>;
    conflict: z.ZodOptional<z.ZodString>;
    targetAudience: z.ZodOptional<z.ZodString>;
    requestedPublicationType: z.ZodOptional<z.ZodEffects<z.ZodEnum<["WEEKLY", "MONTHLY"]>, "WEEKLY" | "MONTHLY", unknown>>;
    publicationType: z.ZodOptional<z.ZodEffects<z.ZodEnum<["WEEKLY", "MONTHLY"]>, "WEEKLY" | "MONTHLY", unknown>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    genres: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    synopsis: string;
    tags: string[];
    genres: string[];
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    requestedPublicationType?: "WEEKLY" | "MONTHLY" | undefined;
}, {
    title: string;
    synopsis: string;
    publicationType?: unknown;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    requestedPublicationType?: unknown;
    tags?: string[] | undefined;
    genres?: string[] | undefined;
}>;
export declare const updateSeriesSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    synopsis: z.ZodOptional<z.ZodString>;
    logline: z.ZodOptional<z.ZodString>;
    premise: z.ZodOptional<z.ZodString>;
    characters: z.ZodOptional<z.ZodString>;
    conflict: z.ZodOptional<z.ZodString>;
    targetAudience: z.ZodOptional<z.ZodString>;
    requestedPublicationType: z.ZodOptional<z.ZodEffects<z.ZodEnum<["WEEKLY", "MONTHLY"]>, "WEEKLY" | "MONTHLY", unknown>>;
    publicationType: z.ZodOptional<z.ZodEffects<z.ZodEnum<["WEEKLY", "MONTHLY"]>, "WEEKLY" | "MONTHLY", unknown>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    genres: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
    title?: string | undefined;
    synopsis?: string | undefined;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    requestedPublicationType?: "WEEKLY" | "MONTHLY" | undefined;
    tags?: string[] | undefined;
    genres?: string[] | undefined;
}, {
    publicationType?: unknown;
    title?: string | undefined;
    synopsis?: string | undefined;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    requestedPublicationType?: unknown;
    tags?: string[] | undefined;
    genres?: string[] | undefined;
}>, {
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
    title?: string | undefined;
    synopsis?: string | undefined;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    requestedPublicationType?: "WEEKLY" | "MONTHLY" | undefined;
    tags?: string[] | undefined;
    genres?: string[] | undefined;
}, {
    publicationType?: unknown;
    title?: string | undefined;
    synopsis?: string | undefined;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    requestedPublicationType?: unknown;
    tags?: string[] | undefined;
    genres?: string[] | undefined;
}>;
export declare const seriesIdParamsSchema: z.ZodObject<{
    seriesId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    seriesId: string;
}, {
    seriesId: string;
}>;
export type CreateSeriesInput = z.infer<typeof createSeriesSchema>;
export type UpdateSeriesInput = z.infer<typeof updateSeriesSchema>;
export declare const createManuscriptUploadSchema: z.ZodObject<{
    originalName: z.ZodString;
    contentType: z.ZodEnum<["image/jpeg", "image/png", "image/webp", "application/pdf", "application/zip", "image/vnd.adobe.photoshop", "application/x-photoshop"]>;
    size: z.ZodNumber;
    expiresIn: z.ZodOptional<z.ZodNumber>;
    assetType: z.ZodOptional<z.ZodEnum<["MANUSCRIPT", "SUPPORTING"]>>;
    slot: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    originalName: string;
    size: number;
    contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | "application/zip" | "image/vnd.adobe.photoshop" | "application/x-photoshop";
    assetType?: "MANUSCRIPT" | "SUPPORTING" | undefined;
    slot?: string | undefined;
    expiresIn?: number | undefined;
}, {
    originalName: string;
    size: number;
    contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | "application/zip" | "image/vnd.adobe.photoshop" | "application/x-photoshop";
    assetType?: "MANUSCRIPT" | "SUPPORTING" | undefined;
    slot?: string | undefined;
    expiresIn?: number | undefined;
}>;
//# sourceMappingURL=series.validation.d.ts.map