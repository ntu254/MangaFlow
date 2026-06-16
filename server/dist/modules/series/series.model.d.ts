import mongoose, { type Document } from "mongoose";
import { type ManuscriptStatus, type PublicationType, type SeriesStatus } from "../../shared/workflow/status.js";
export type SeriesMemberRole = "MANGAKA" | "ASSISTANT" | "EDITOR";
export type SeriesMemberAccessScope = "FULL" | "TASK_ONLY";
export type SeriesMemberStatus = "INVITED" | "ACTIVE" | "REMOVED" | "PAUSED";
export interface SeriesDocument extends Document {
    title: string;
    slug: string;
    synopsis: string;
    logline?: string;
    premise?: string;
    characters?: string;
    conflict?: string;
    targetAudience?: string;
    requestedPublicationType?: PublicationType;
    publicationType?: PublicationType;
    tags?: string[];
    genres: string[];
    ownerId: mongoose.Types.ObjectId;
    status: SeriesStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Series: mongoose.Model<SeriesDocument, {}, {}, {}, mongoose.Document<unknown, {}, SeriesDocument, {}, {}> & SeriesDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface SeriesMemberDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: SeriesMemberRole;
    /** Flow-03: status enum replaces the old isActive boolean. */
    status: SeriesMemberStatus;
    /** @deprecated Use status === "ACTIVE" instead. Kept for backward-compat read. */
    isActive: boolean;
    accessScope: SeriesMemberAccessScope;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SeriesMember: mongoose.Model<SeriesMemberDocument, {}, {}, {}, mongoose.Document<unknown, {}, SeriesMemberDocument, {}, {}> & SeriesMemberDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ManuscriptDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    version: number;
    status: ManuscriptStatus;
    fileAssetId?: mongoose.Types.ObjectId;
    reviewNote?: string;
    editorRecommendation?: string;
    feasibilityNote?: string;
    suggestedPublicationType?: PublicationType;
    riskNote?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Manuscript: mongoose.Model<ManuscriptDocument, {}, {}, {}, mongoose.Document<unknown, {}, ManuscriptDocument, {}, {}> & ManuscriptDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=series.model.d.ts.map