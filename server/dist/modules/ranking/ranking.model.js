import mongoose, { Schema } from "mongoose";
import { RANKING_STATUSES } from "../../shared/workflow/status.js";
const rankingSchema = new Schema({
    period: { type: String, required: true, trim: true, index: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    voteCount: { type: Number, required: true, min: 0 },
    readerScore: { type: Number, required: true, min: 1, max: 10 },
    finalScore: { type: Number, required: true, min: 0 },
    status: { type: String, enum: RANKING_STATUSES, required: true, default: "DRAFT", index: true },
}, { timestamps: true });
rankingSchema.index({ period: 1, seriesId: 1 }, { unique: true });
export const Ranking = mongoose.model("Ranking", rankingSchema);
//# sourceMappingURL=ranking.model.js.map