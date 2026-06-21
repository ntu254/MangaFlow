import mongoose, { Schema, type Document } from "mongoose"
import { CHAPTER_STATUSES, type ChapterStatus } from "../../shared/workflow/status.js"

export const PAGE_STATUSES = [
  "UPLOADING",
  "UPLOADED",
  "PROCESSING_FAILED",
  "TASK_ASSIGNED",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "APPROVED",
] as const
export type PageStatus = (typeof PAGE_STATUSES)[number]

export interface PageDocument extends Document {
  chapterId: mongoose.Types.ObjectId
  pageNumber: number
  status: PageStatus
  originalFileAssetId?: mongoose.Types.ObjectId
  workingFileAssetId?: mongoose.Types.ObjectId
  thumbnailFileAssetId?: mongoose.Types.ObjectId
  variantFileAssetIds?: mongoose.Types.ObjectId[]
  regionIds: mongoose.Types.ObjectId[]
  deletedAt?: Date
  deletedBy?: mongoose.Types.ObjectId
  deleteReason?: string
  archivedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const pageSchema = new Schema<PageDocument>(
  {
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
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deleteReason: { type: String, maxlength: 500 },
    archivedAt: { type: Date },
  },
  { timestamps: true },
)

pageSchema.index(
  { chapterId: 1, pageNumber: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } },
)

pageSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const Page = mongoose.model<PageDocument>("Page", pageSchema)

export interface ChapterDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  chapterNumber: number
  title: string
  status: ChapterStatus
  publicationTypeSnapshot?: string
  draftSchedule?: Date
  deletedAt?: Date
  deletedBy?: mongoose.Types.ObjectId
  deleteReason?: string
  archivedAt?: Date
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
    publicationTypeSnapshot: { type: String, trim: true },
    draftSchedule: { type: Date },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deleteReason: { type: String, maxlength: 500 },
    archivedAt: { type: Date },
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
  status: "ACTIVE" | "MISSING" | "DELETED"
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
    status: { type: String, enum: ["ACTIVE", "MISSING", "DELETED"], default: "ACTIVE" },
  },
  { timestamps: true },
)

export const FileAsset = mongoose.model<FileAssetDocument>("FileAsset", fileAssetSchema)

export const REGION_TYPES = ["PANEL", "BUBBLE", "SFX", "AREA", "OTHER"] as const
export type RegionType = (typeof REGION_TYPES)[number]

export const REGION_STATUSES = [
  "CREATED",
  "AI_SUGGESTED",
  "ACCEPTED",
  "REJECTED",
  "LINKED_TO_TASK",
  "ARCHIVED",
] as const
export type RegionStatus = (typeof REGION_STATUSES)[number]

export interface RegionDocument extends Document {
  pageId: mongoose.Types.ObjectId
  regionIndex: number
  type: RegionType
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
  status: RegionStatus
  source: "MANUAL" | "AI"
  aiResultId?: mongoose.Types.ObjectId
  confidence?: number
  createdAt: Date
  updatedAt: Date
}

const regionSchema = new Schema<RegionDocument>(
  {
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
  },
  { timestamps: true },
)

regionSchema.index({ pageId: 1, regionIndex: 1 }, { unique: true })

regionSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const Region = mongoose.model<RegionDocument>("Region", regionSchema)

export const AI_RESULT_STATUSES = ["PENDING", "COMPLETED", "FAILED", "PARTIALLY_ACCEPTED"] as const
export type AIResultStatus = (typeof AI_RESULT_STATUSES)[number]

export interface AISuggestion {
  suggestionIndex: number
  type: RegionType
  bbox: { x: number; y: number; width: number; height: number }
  confidence?: number
  decision: "PENDING" | "ACCEPTED" | "REJECTED"
  regionId?: mongoose.Types.ObjectId
}

export interface AIResultDocument extends Document {
  pageId: mongoose.Types.ObjectId
  workingFileAssetId?: mongoose.Types.ObjectId
  status: AIResultStatus
  /** AI model identifier — renamed to avoid conflict with Mongoose Document.model() */
  modelName?: string
  suggestions: AISuggestion[]
  error?: string
  requestedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const aiResultSchema = new Schema<AIResultDocument>(
  {
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
  },
  { timestamps: true },
)

aiResultSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const AIResult = mongoose.model<AIResultDocument>("AIResult", aiResultSchema)
