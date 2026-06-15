import mongoose, { type Document } from "mongoose";
import { type ChapterStatus } from "../../shared/workflow/status.js";
export interface PageDocument extends Document {
    chapterId: mongoose.Types.ObjectId;
    pageNumber: number;
    status: "UPLOADED" | "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
    originalFileAssetId?: mongoose.Types.ObjectId;
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
    originalName: string;
    mimeType: string;
    size: number;
    r2Key: string;
    r2Bucket: string;
    uploadedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FileAsset: mongoose.Model<FileAssetDocument, {}, {}, {}, mongoose.Document<unknown, {}, FileAssetDocument, {}, {}> & FileAssetDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface RegionDocument extends Document {
    pageId: mongoose.Types.ObjectId;
    regionIndex: number;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    status: "ACTIVE" | "ARCHIVED";
    createdAt: Date;
    updatedAt: Date;
}
export declare const Region: mongoose.Model<RegionDocument, {}, {}, {}, mongoose.Document<unknown, {}, RegionDocument, {}, {}> & RegionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=chapter.model.d.ts.map