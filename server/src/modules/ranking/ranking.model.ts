import mongoose, { Schema, type Document } from "mongoose"
import { RANKING_STATUSES, type RankingStatus } from "../../shared/workflow/status.js"

export interface RankingDocument extends Document {
  period: string
  seriesId: mongoose.Types.ObjectId
  voteCount: number
  readerScore: number
  finalScore: number
  status: RankingStatus
  createdAt: Date
  updatedAt: Date
}

const rankingSchema = new Schema<RankingDocument>(
  {
    period: { type: String, required: true, trim: true, index: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    voteCount: { type: Number, required: true, min: 0 },
    readerScore: { type: Number, required: true, min: 1, max: 10 },
    finalScore: { type: Number, required: true, min: 0 },
    status: { type: String, enum: RANKING_STATUSES, required: true, default: "DRAFT", index: true },
  },
  { timestamps: true },
)

rankingSchema.index({ period: 1, seriesId: 1 }, { unique: true })

export const Ranking = mongoose.model<RankingDocument>("Ranking", rankingSchema)
