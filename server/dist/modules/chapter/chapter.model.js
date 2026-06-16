import mongoose, { Schema } from "mongoose";
import { CHAPTER_STATUSES } from "../../shared/workflow/status.js";
export const PAGE_STATUSES = [
    "UPLOADING",
    "UPLOADED",
    "PROCESSING_FAILED",
    "TASK_ASSIGNED",
    "IN_PROGRESS",
    "UNDER_REVIEW",
    "APPROVED",
];
const pageSchema = new Schema({
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
    pageNumber: { type: Number, required: true },
    status: {
        type: String,
        enum: PAGE_STATUSES,
        required: true,
        default: "UPLOADING",
    },
    originalFileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    workingFileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    thumbnailFileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    variantFileAssetIds: [{ type: Schema.Types.ObjectId, ref: "FileAsset" }],
    regionIds: [{ type: Schema.Types.ObjectId, ref: "Region" }],
}, { timestamps: true });
pageSchema.index({ chapterId: 1, pageNumber: 1 }, { unique: true });
pageSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const Page = mongoose.model("Page", pageSchema);
const chapterSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    chapterNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    status: {
        type: String,
        enum: CHAPTER_STATUSES,
        required: true,
        default: "DRAFT",
        index: true,
    },
    publicationTypeSnapshot: { type: String, trim: true },
    draftSchedule: { type: Date },
}, { timestamps: true });
chapterSchema.index({ seriesId: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const Chapter = mongoose.model("Chapter", chapterSchema);
const fileAssetSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", index: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    r2Key: { type: String, required: true },
    r2Bucket: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assetType: { type: String, enum: ["MANUSCRIPT", "SUPPORTING", "PRODUCTION"] },
    slot: { type: String, trim: true, maxlength: 80 },
}, { timestamps: true });
export const FileAsset = mongoose.model("FileAsset", fileAssetSchema);
export const REGION_TYPES = ["PANEL", "BUBBLE", "SFX", "AREA", "OTHER"];
export const REGION_STATUSES = [
    "CREATED",
    "AI_SUGGESTED",
    "ACCEPTED",
    "REJECTED",
    "LINKED_TO_TASK",
    "ARCHIVED",
];
const regionSchema = new Schema({
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    regionIndex: { type: Number, required: true },
    type: { type: String, enum: REGION_TYPES, required: true, default: "PANEL" },
    bbox: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true, min: 1 },
        height: { type: Number, required: true, min: 1 },
    },
    status: {
        type: String,
        enum: REGION_STATUSES,
        required: true,
        default: "CREATED",
    },
    source: { type: String, enum: ["MANUAL", "AI"], required: true, default: "MANUAL" },
    aiResultId: { type: Schema.Types.ObjectId, ref: "AIResult" },
    confidence: { type: Number, min: 0, max: 1 },
}, { timestamps: true });
regionSchema.index({ pageId: 1, regionIndex: 1 }, { unique: true });
regionSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const Region = mongoose.model("Region", regionSchema);
export const AI_RESULT_STATUSES = ["PENDING", "COMPLETED", "FAILED", "PARTIALLY_ACCEPTED"];
const aiResultSchema = new Schema({
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    workingFileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    status: { type: String, enum: AI_RESULT_STATUSES, required: true, default: "PENDING" },
    modelName: { type: String, trim: true },
    suggestions: [
        {
            suggestionIndex: { type: Number, required: true },
            type: { type: String, enum: REGION_TYPES, required: true, default: "BUBBLE" },
            bbox: {
                x: { type: Number, required: true },
                y: { type: Number, required: true },
                width: { type: Number, required: true },
                height: { type: Number, required: true },
            },
            confidence: { type: Number, min: 0, max: 1 },
            decision: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" },
            regionId: { type: Schema.Types.ObjectId, ref: "Region" },
        },
    ],
    error: { type: String, trim: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
aiResultSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const AIResult = mongoose.model("AIResult", aiResultSchema);
//# sourceMappingURL=chapter.model.js.map