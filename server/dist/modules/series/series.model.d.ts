import mongoose, { type Document } from "mongoose";
import { type ManuscriptStatus, type SeriesStatus } from "../../shared/workflow/status.js";
export type SeriesMemberRole = "MANGAKA" | "ASSISTANT" | "EDITOR";
export type SeriesMemberAccessScope = "FULL" | "TASK_ONLY";
export interface SeriesDocument extends Document {
    title: string;
    slug: string;
    synopsis: string;
    logline?: string;
    premise?: string;
    characters?: string;
    conflict?: string;
    targetAudience?: string;
    publicationType?: string;
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
    createdAt: Date;
    updatedAt: Date;
}
export declare const Manuscript: mongoose.Model<ManuscriptDocument, {}, {}, {}, mongoose.Document<unknown, {}, ManuscriptDocument, {}, {}> & ManuscriptDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=series.model.d.ts.map