import mongoose, { Schema, Document } from "mongoose";

export const rankingStatuses = ["NORMAL", "WARNING", "AT_RISK"] as const;
export type RankingStatus = typeof rankingStatuses[number];

export interface RankingDocument extends Document {
  seriesId: mongoose.Types.ObjectId;
  period: string;
  voteCount: number;
  readerScore: number;
  normalizedReaderScore: number;
  finalScore: number;
  rank: number;
  previousRank?: number;
  status: RankingStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rankingSchema = new Schema<RankingDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    period: { type: String, required: true, index: true },
    voteCount: { type: Number, required: true },
    readerScore: { type: Number, required: true },
    normalizedReaderScore: { type: Number, required: true },
    finalScore: { type: Number, required: true },
    rank: { type: Number, required: true },
    previousRank: { type: Number },
    status: { type: String, enum: rankingStatuses, required: true, default: "NORMAL" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

rankingSchema.index({ period: 1, seriesId: 1 }, { unique: true });

export const RankingModel = mongoose.model<RankingDocument>("Ranking", rankingSchema);
