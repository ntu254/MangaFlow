import mongoose, { Schema, type Document } from "mongoose"
import { CHAPTER_STATUSES, type ChapterStatus } from "../../shared/workflow/status.js"

export interface PageDocument extends Document {
  chapterId: mongoose.Types.ObjectId
  pageNumber: number
  status: "UPLOADED" | "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED"
  originalFileAssetId?: mongoose.Types.ObjectId
  variantFileAssetIds?: mongoose.Types.ObjectId[]
  regionIds: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const pageSchema = new Schema<PageDocument>(
  {
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
  },
  { timestamps: true },
)

pageSchema.index({ chapterId: 1, pageNumber: 1 }, { unique: true })

export const Page = mongoose.model<PageDocument>("Page", pageSchema)

export interface ChapterDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  chapterNumber: number
  title: string
  status: ChapterStatus
  draftSchedule?: Date
  createdAt: Date
  updatedAt: Date
}

const chapterSchema = new Schema<ChapterDocument>(
  {
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
  },
  { timestamps: true },
)

chapterSchema.index({ seriesId: 1, chapterNumber: 1 }, { unique: true })

chapterSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const Chapter = mongoose.model<ChapterDocument>("Chapter", chapterSchema)

export interface FileAssetDocument extends Document {
  seriesId?: mongoose.Types.ObjectId
  originalName: string
  mimeType: string
  size: number
  r2Key: string
  r2Bucket: string
  uploadedBy: mongoose.Types.ObjectId
  assetType?: "MANUSCRIPT" | "SUPPORTING" | "PRODUCTION"
  slot?: string
  createdAt: Date
  updatedAt: Date
}

const fileAssetSchema = new Schema<FileAssetDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", index: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    r2Key: { type: String, required: true },
    r2Bucket: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assetType: { type: String, enum: ["MANUSCRIPT", "SUPPORTING", "PRODUCTION"] },
    slot: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true },
)

export const FileAsset = mongoose.model<FileAssetDocument>("FileAsset", fileAssetSchema)

export interface RegionDocument extends Document {
  pageId: mongoose.Types.ObjectId
  regionIndex: number
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
  status: "ACTIVE" | "ARCHIVED"
  createdAt: Date
  updatedAt: Date
}

const regionSchema = new Schema<RegionDocument>(
  {
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
  },
  { timestamps: true },
)

regionSchema.index({ pageId: 1, regionIndex: 1 }, { unique: true })

export const Region = mongoose.model<RegionDocument>("Region", regionSchema)
