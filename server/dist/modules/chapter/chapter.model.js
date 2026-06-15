import mongoose, { Schema } from "mongoose";
import { CHAPTER_STATUSES } from "../../shared/workflow/status.js";
const pageSchema = new Schema({
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
    pageNumber: { type: Number, required: true },
    status: {
        type: String,
        enum: ["UPLOADED", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REVISION_REQUESTED"],
        required: true,
        default: "UPLOADED",
    },
    originalFileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    variantFileAssetIds: [{ type: Schema.Types.ObjectId, ref: "FileAsset" }],
    regionIds: [{ type: Schema.Types.ObjectId, ref: "Region" }],
}, { timestamps: true });
pageSchema.index({ chapterId: 1, pageNumber: 1 }, { unique: true });
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
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    r2Key: { type: String, required: true },
    r2Bucket: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true });
export const FileAsset = mongoose.model("FileAsset", fileAssetSchema);
const regionSchema = new Schema({
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    regionIndex: { type: Number, required: true },
    bbox: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true, min: 1 },
        height: { type: Number, required: true, min: 1 },
    },
    status: {
        type: String,
        enum: ["ACTIVE", "ARCHIVED"],
        required: true,
        default: "ACTIVE",
    },
}, { timestamps: true });
regionSchema.index({ pageId: 1, regionIndex: 1 }, { unique: true });
export const Region = mongoose.model("Region", regionSchema);
//# sourceMappingURL=chapter.model.js.map