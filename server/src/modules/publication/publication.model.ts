import mongoose, { Schema, type Document } from "mongoose"
import { PUBLICATION_STATUSES, type PublicationStatus } from "../../shared/workflow/status.js"

export interface PublicationDocument extends Document {
  chapterId: mongoose.Types.ObjectId
  chapterVersionId?: mongoose.Types.ObjectId
  seriesId: mongoose.Types.ObjectId
  status: PublicationStatus
  scheduledFor?: Date
  publishedAt?: Date
  createdBy: mongoose.Types.ObjectId
  scheduleManagedBy?: mongoose.Types.ObjectId
  publishedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const publicationSchema = new Schema<PublicationDocument>(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, unique: true, index: true },
    chapterVersionId: { type: Schema.Types.ObjectId, ref: "ChapterVersion", index: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    status: { type: String, enum: PUBLICATION_STATUSES, default: "DRAFT" },
    scheduledFor: { type: Date, index: true },
    publishedAt: { type: Date, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scheduleManagedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
)

publicationSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.__v
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const Publication = mongoose.model<PublicationDocument>("Publication", publicationSchema)
