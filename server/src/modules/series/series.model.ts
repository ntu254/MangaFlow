import mongoose, { Schema, type Document } from "mongoose"
import { MANUSCRIPT_STATUSES, PUBLICATION_TYPES, SERIES_STATUSES, type ManuscriptStatus, type PublicationType, type SeriesStatus } from "../../shared/workflow/status.js"

export type SeriesMemberRole = "MANGAKA" | "ASSISTANT" | "EDITOR"
export type SeriesMemberAccessScope = "FULL" | "TASK_ONLY"

export interface SeriesDocument extends Document {
  title: string
  slug: string
  synopsis: string
  logline?: string
  premise?: string
  characters?: string
  conflict?: string
  targetAudience?: string
  requestedPublicationType?: PublicationType
  publicationType?: PublicationType
  tags?: string[]
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
  },
  { timestamps: true },
)

seriesSchema.set("toJSON", {
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
    accessScope: { type: String, enum: ["FULL", "TASK_ONLY"], required: true, default: "FULL" },
  },
  { timestamps: true },
)

seriesMemberSchema.index({ seriesId: 1, userId: 1 }, { unique: true })

export const SeriesMember = mongoose.model<SeriesMemberDocument>("SeriesMember", seriesMemberSchema)

export interface ManuscriptDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  uploadedBy: mongoose.Types.ObjectId
  version: number
  status: ManuscriptStatus
  fileAssetId?: mongoose.Types.ObjectId
  reviewNote?: string
  editorRecommendation?: string
  feasibilityNote?: string
  suggestedPublicationType?: PublicationType
  riskNote?: string
  createdAt: Date
  updatedAt: Date
}

const manuscriptSchema = new Schema<ManuscriptDocument>(
  {
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
  },
  { timestamps: true },
)

manuscriptSchema.index({ seriesId: 1, version: 1 }, { unique: true })

export const Manuscript = mongoose.model<ManuscriptDocument>("Manuscript", manuscriptSchema)
