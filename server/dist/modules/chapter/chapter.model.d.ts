import mongoose, { type Document } from "mongoose";
import { type ChapterStatus } from "../../shared/workflow/status.js";
export declare const PAGE_STATUSES: readonly ["UPLOADING", "UPLOADED", "PROCESSING_FAILED", "TASK_ASSIGNED", "IN_PROGRESS", "UNDER_REVIEW", "APPROVED"];
export type PageStatus = (typeof PAGE_STATUSES)[number];
export interface PageDocument extends Document {
    chapterId: mongoose.Types.ObjectId;
    pageNumber: number;
    status: PageStatus;
    originalFileAssetId?: mongoose.Types.ObjectId;
    workingFileAssetId?: mongoose.Types.ObjectId;
    thumbnailFileAssetId?: mongoose.Types.ObjectId;
    variantFileAssetIds?: mongoose.Types.ObjectId[];
    regionIds: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Page: mongoose.Model<PageDocument, {}, {}, {}, mongoose.Document<unknown, {}, PageDocument, {}, {}> & PageDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ChapterDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    chapterNumber: number;
    title: string;
    status: ChapterStatus;
    publicationTypeSnapshot?: string;
    draftSchedule?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Chapter: mongoose.Model<ChapterDocument, {}, {}, {}, mongoose.Document<unknown, {}, ChapterDocument, {}, {}> & ChapterDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface FileAssetDocument extends Document {
    seriesId?: mongoose.Types.ObjectId;
    originalName: string;
    mimeType: string;
    size: number;
    r2Key: string;
    r2Bucket: string;
    uploadedBy: mongoose.Types.ObjectId;
    assetType?: "MANUSCRIPT" | "SUPPORTING" | "PRODUCTION";
    slot?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FileAsset: mongoose.Model<FileAssetDocument, {}, {}, {}, mongoose.Document<unknown, {}, FileAssetDocument, {}, {}> & FileAssetDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const REGION_TYPES: readonly ["PANEL", "BUBBLE", "SFX", "AREA", "OTHER"];
export type RegionType = (typeof REGION_TYPES)[number];
export declare const REGION_STATUSES: readonly ["CREATED", "AI_SUGGESTED", "ACCEPTED", "REJECTED", "LINKED_TO_TASK", "ARCHIVED"];
export type RegionStatus = (typeof REGION_STATUSES)[number];
export interface RegionDocument extends Document {
    pageId: mongoose.Types.ObjectId;
    regionIndex: number;
    type: RegionType;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    status: RegionStatus;
    source: "MANUAL" | "AI";
    aiResultId?: mongoose.Types.ObjectId;
    confidence?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Region: mongoose.Model<RegionDocument, {}, {}, {}, mongoose.Document<unknown, {}, RegionDocument, {}, {}> & RegionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const AI_RESULT_STATUSES: readonly ["PENDING", "COMPLETED", "FAILED", "PARTIALLY_ACCEPTED"];
export type AIResultStatus = (typeof AI_RESULT_STATUSES)[number];
export interface AISuggestion {
    suggestionIndex: number;
    type: RegionType;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    confidence?: number;
    decision: "PENDING" | "ACCEPTED" | "REJECTED";
    regionId?: mongoose.Types.ObjectId;
}
export interface AIResultDocument extends Document {
    pageId: mongoose.Types.ObjectId;
    workingFileAssetId?: mongoose.Types.ObjectId;
    status: AIResultStatus;
    /** AI model identifier — renamed to avoid conflict with Mongoose Document.model() */
    modelName?: string;
    suggestions: AISuggestion[];
    error?: string;
    requestedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AIResult: mongoose.Model<AIResultDocument, {}, {}, {}, mongoose.Document<unknown, {}, AIResultDocument, {}, {}> & AIResultDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=chapter.model.d.ts.map