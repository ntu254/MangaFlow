import mongoose, { Schema, type Document } from "mongoose"

export const CHAPTER_VERSION_STATUSES = ["SUBMITTED", "REVISION_REQUESTED", "APPROVED"] as const
export type ChapterVersionStatus = (typeof CHAPTER_VERSION_STATUSES)[number]

export const CHAPTER_REVIEW_ANNOTATION_STATUSES = ["OPEN", "RESOLVED"] as const
export type ChapterReviewAnnotationStatus = (typeof CHAPTER_REVIEW_ANNOTATION_STATUSES)[number]

export interface ChapterPageSnapshot {
  pageId: mongoose.Types.ObjectId
  pageNumber: number
  fileAssetId: mongoose.Types.ObjectId
  originalFileAssetId?: mongoose.Types.ObjectId
  workingFileAssetId?: mongoose.Types.ObjectId
  thumbnailFileAssetId?: mongoose.Types.ObjectId
  status: string
}

export interface ChapterVersionDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  chapterId: mongoose.Types.ObjectId
  version: number
  status: ChapterVersionStatus
  submittedBy: mongoose.Types.ObjectId
  submittedAt: Date
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  reviewerNote?: string
  isLocked: boolean
  lockedAt?: Date
  lockedBy?: mongoose.Types.ObjectId
  pageSnapshots: ChapterPageSnapshot[]
  createdAt: Date
  updatedAt: Date
}

const pageSnapshotSchema = new Schema<ChapterPageSnapshot>(
  {
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true },
    pageNumber: { type: Number, required: true },
    fileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset", required: true },
    originalFileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    workingFileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    thumbnailFileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    status: { type: String, required: true },
  },
  { _id: false },
)

const chapterVersionSchema = new Schema<ChapterVersionDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
    version: { type: Number, required: true, min: 1 },
    status: { type: String, enum: CHAPTER_VERSION_STATUSES, required: true, default: "SUBMITTED", index: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, required: true, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewerNote: { type: String, trim: true, maxlength: 5000 },
    isLocked: { type: Boolean, required: true, default: false, index: true },
    lockedAt: { type: Date },
    lockedBy: { type: Schema.Types.ObjectId, ref: "User" },
    pageSnapshots: { type: [pageSnapshotSchema], required: true, default: [] },
  },
  { timestamps: true },
)

chapterVersionSchema.index({ chapterId: 1, version: 1 }, { unique: true })
chapterVersionSchema.index({ seriesId: 1, status: 1, updatedAt: -1 })

chapterVersionSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const ChapterVersion = mongoose.model<ChapterVersionDocument>("ChapterVersion", chapterVersionSchema)

export interface ChapterReviewAnnotationGeometry {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface ChapterReviewAnnotationDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  chapterId: mongoose.Types.ObjectId
  chapterVersionId: mongoose.Types.ObjectId
  pageId?: mongoose.Types.ObjectId
  body: string
  geometry?: ChapterReviewAnnotationGeometry
  isBlocking: boolean
  status: ChapterReviewAnnotationStatus
  authorId: mongoose.Types.ObjectId
  resolvedBy?: mongoose.Types.ObjectId
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const annotationGeometrySchema = new Schema<ChapterReviewAnnotationGeometry>(
  {
    x: { type: Number, min: 0, max: 1 },
    y: { type: Number, min: 0, max: 1 },
    width: { type: Number, min: 0, max: 1 },
    height: { type: Number, min: 0, max: 1 },
  },
  { _id: false },
)

const chapterReviewAnnotationSchema = new Schema<ChapterReviewAnnotationDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
    chapterVersionId: { type: Schema.Types.ObjectId, ref: "ChapterVersion", required: true, index: true },
    pageId: { type: Schema.Types.ObjectId, ref: "Page", index: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    geometry: annotationGeometrySchema,
    isBlocking: { type: Boolean, required: true, default: true },
    status: { type: String, enum: CHAPTER_REVIEW_ANNOTATION_STATUSES, required: true, default: "OPEN", index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
)

chapterReviewAnnotationSchema.index({ chapterVersionId: 1, status: 1 })

chapterReviewAnnotationSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const ChapterReviewAnnotation = mongoose.model<ChapterReviewAnnotationDocument>(
  "ChapterReviewAnnotation",
  chapterReviewAnnotationSchema,
)
