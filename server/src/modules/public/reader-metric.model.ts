import mongoose, { Schema, type Document, type Types } from "mongoose"

export interface IReaderMetric extends Document {
  seriesId: Types.ObjectId
  chapterId: Types.ObjectId
  ipAddress?: string
  viewDurationSeconds?: number
  createdAt: Date
  updatedAt: Date
}

const readerMetricSchema = new Schema<IReaderMetric>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    ipAddress: { type: String },
    viewDurationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
)

readerMetricSchema.index({ seriesId: 1 })
readerMetricSchema.index({ chapterId: 1 })
readerMetricSchema.index({ createdAt: 1 })

export const ReaderMetric = mongoose.model<IReaderMetric>("ReaderMetric", readerMetricSchema)
