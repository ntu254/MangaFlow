import { z } from "zod";
export declare const createSeriesSchema: z.ZodObject<{
    title: z.ZodString;
    synopsis: z.ZodString;
    logline: z.ZodOptional<z.ZodString>;
    premise: z.ZodOptional<z.ZodString>;
    characters: z.ZodOptional<z.ZodString>;
    conflict: z.ZodOptional<z.ZodString>;
    targetAudience: z.ZodOptional<z.ZodString>;
    publicationType: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    genres: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    synopsis: string;
    tags: string[];
    genres: string[];
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    publicationType?: string | undefined;
}, {
    title: string;
    synopsis: string;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    publicationType?: string | undefined;
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
    publicationType: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    genres: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    synopsis?: string | undefined;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    publicationType?: string | undefined;
    tags?: string[] | undefined;
    genres?: string[] | undefined;
}, {
    title?: string | undefined;
    synopsis?: string | undefined;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    publicationType?: string | undefined;
    tags?: string[] | undefined;
    genres?: string[] | undefined;
}>, {
    title?: string | undefined;
    synopsis?: string | undefined;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    publicationType?: string | undefined;
    tags?: string[] | undefined;
    genres?: string[] | undefined;
}, {
    title?: string | undefined;
    synopsis?: string | undefined;
    logline?: string | undefined;
    premise?: string | undefined;
    characters?: string | undefined;
    conflict?: string | undefined;
    targetAudience?: string | undefined;
    publicationType?: string | undefined;
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
    contentType: z.ZodEnum<["image/jpeg", "image/png", "image/webp", "application/pdf", "application/zip"]>;
    size: z.ZodNumber;
    expiresIn: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    originalName: string;
    size: number;
    contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | "application/zip";
    expiresIn?: number | undefined;
}, {
    originalName: string;
    size: number;
    contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | "application/zip";
    expiresIn?: number | undefined;
}>;
//# sourceMappingURL=series.validation.d.ts.map