import mongoose, { Schema } from "mongoose";
import { MANUSCRIPT_STATUSES, PUBLICATION_TYPES, SERIES_STATUSES } from "../../shared/workflow/status.js";
const seriesSchema = new Schema({
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    synopsis: { type: String, required: true, trim: true, maxlength: 2000 },
    logline: { type: String, trim: true, maxlength: 200 },
    premise: { type: String, trim: true, maxlength: 2000 },
    characters: { type: String, trim: true, maxlength: 2000 },
    conflict: { type: String, trim: true, maxlength: 2000 },
    targetAudience: { type: String, trim: true, maxlength: 120 },
    requestedPublicationType: { type: String, enum: PUBLICATION_TYPES },
    publicationType: { type: String, enum: PUBLICATION_TYPES },
    tags: { type: [String], default: [] },
    genres: { type: [String], default: [] },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
        type: String,
        enum: SERIES_STATUSES,
        required: true,
        default: "DRAFT",
        index: true,
    },
}, { timestamps: true });
seriesSchema.set("toJSON", {
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const Series = mongoose.model("Series", seriesSchema);
const seriesMemberSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["MANGAKA", "ASSISTANT", "EDITOR"], required: true },
    status: {
        type: String,
        enum: ["INVITED", "ACTIVE", "REMOVED", "PAUSED"],
        required: true,
        default: "ACTIVE",
        index: true,
    },
    /** Virtual backward-compat getter so old code reading .isActive still works. */
    isActive: { type: Boolean, default: true },
    accessScope: { type: String, enum: ["FULL", "TASK_ONLY"], required: true, default: "FULL" },
}, { timestamps: true });
seriesMemberSchema.index({ seriesId: 1, userId: 1 }, { unique: true });
export const SeriesMember = mongoose.model("SeriesMember", seriesMemberSchema);
const manuscriptSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    version: { type: Number, required: true, min: 1 },
    status: { type: String, enum: MANUSCRIPT_STATUSES, required: true, default: "DRAFT", index: true },
    fileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    reviewNote: { type: String, trim: true, maxlength: 2000 },
    editorRecommendation: { type: String, trim: true, maxlength: 2000 },
    feasibilityNote: { type: String, trim: true, maxlength: 2000 },
    suggestedPublicationType: { type: String, enum: PUBLICATION_TYPES },
    riskNote: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });
manuscriptSchema.index({ seriesId: 1, version: 1 }, { unique: true });
export const Manuscript = mongoose.model("Manuscript", manuscriptSchema);
//# sourceMappingURL=series.model.js.map