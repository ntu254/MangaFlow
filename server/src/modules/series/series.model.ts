import mongoose, { Schema, type Document } from "mongoose"
import { SERIES_STATUSES, type SeriesStatus } from "../../shared/workflow/status.js"

export type SeriesMemberRole = "MANGAKA" | "ASSISTANT" | "EDITOR"
export type SeriesMemberAccessScope = "FULL" | "TASK_ONLY"

export interface SeriesDocument extends Document {
  title: string
  slug: string
  synopsis: string
  genres: string[]
  ownerId: mongoose.Types.ObjectId
  status: SeriesStatus
  createdAt: Date
  updatedAt: Date
}

const seriesSchema = new Schema<SeriesDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    synopsis: { type: String, required: true, trim: true, maxlength: 2000 },
    genres: { type: [String], default: [] },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: SERIES_STATUSES,
      required: true,
      default: "DRAFT",
      index: true,
    },
  },
  { timestamps: true },
)

seriesSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const Series = mongoose.model<SeriesDocument>("Series", seriesSchema)

export interface SeriesMemberDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  role: SeriesMemberRole
  isActive: boolean
  accessScope: SeriesMemberAccessScope
  createdAt: Date
  updatedAt: Date
}

const seriesMemberSchema = new Schema<SeriesMemberDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["MANGAKA", "ASSISTANT", "EDITOR"], required: true },
    isActive: { type: Boolean, default: true },
    accessScope: {
      type: String,
      enum: ["FULL", "TASK_ONLY"],
      required: true,
      default: "FULL",
    },
  },
  { timestamps: true },
)

seriesMemberSchema.index({ seriesId: 1, userId: 1 }, { unique: true })

export const SeriesMember = mongoose.model<SeriesMemberDocument>("SeriesMember", seriesMemberSchema)

export interface ManuscriptDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  uploadedBy: mongoose.Types.ObjectId
  fileAssetId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const manuscriptSchema = new Schema<ManuscriptDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
  },
  { timestamps: true },
)

export const Manuscript = mongoose.model<ManuscriptDocument>("Manuscript", manuscriptSchema)
