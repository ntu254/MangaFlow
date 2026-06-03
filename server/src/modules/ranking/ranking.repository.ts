import mongoose from "mongoose";
import { RankingModel, type RankingDocument, type RankingStatus } from "./ranking.model.js";

export interface Ranking {
  id: string;
  seriesId: string;
  period: string;
  voteCount: number;
  readerScore: number;
  normalizedReaderScore: number;
  finalScore: number;
  rank: number;
  previousRank?: number;
  status: RankingStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

function serializeRanking(doc: RankingDocument & { _id: unknown }): Ranking {
  return {
    id: String(doc._id),
    seriesId: String(doc.seriesId),
    period: doc.period,
    voteCount: doc.voteCount,
    readerScore: doc.readerScore,
    normalizedReaderScore: doc.normalizedReaderScore,
    finalScore: doc.finalScore,
    rank: doc.rank,
    previousRank: doc.previousRank,
    status: doc.status,
    createdBy: String(doc.createdBy),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

export function createMongoRankingRepository() {
  return {
    async createOrUpdateRanking(data: Omit<Ranking, "id" | "createdAt" | "updatedAt">): Promise<Ranking> {
      const doc = await RankingModel.findOneAndUpdate(
        { period: data.period, seriesId: new mongoose.Types.ObjectId(data.seriesId) },
        {
          $set: {
            voteCount: data.voteCount,
            readerScore: data.readerScore,
            normalizedReaderScore: data.normalizedReaderScore,
            finalScore: data.finalScore,
            rank: data.rank,
            previousRank: data.previousRank,
            status: data.status,
            createdBy: new mongoose.Types.ObjectId(data.createdBy)
          }
        },
        { upsert: true, returnDocument: "after" }
      );
      return serializeRanking(doc);
    },

    async findRankingById(id: string): Promise<Ranking | null> {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await RankingModel.findById(id);
      return doc ? serializeRanking(doc) : null;
    },

    async findRankingsByPeriod(period: string): Promise<Ranking[]> {
      const docs = await RankingModel.find({ period }).sort({ rank: 1 });
      return docs.map(serializeRanking);
    },

    async findRankingsBySeries(seriesId: string): Promise<Ranking[]> {
      if (!mongoose.isValidObjectId(seriesId)) return [];
      const docs = await RankingModel.find({ seriesId: new mongoose.Types.ObjectId(seriesId) }).sort({ period: 1 });
      return docs.map(serializeRanking);
    },

    async findOneRankingByPeriodAndSeries(period: string, seriesId: string): Promise<Ranking | null> {
      if (!mongoose.isValidObjectId(seriesId)) return null;
      const doc = await RankingModel.findOne({ period, seriesId: new mongoose.Types.ObjectId(seriesId) });
      return doc ? serializeRanking(doc) : null;
    },

    async updateRankingStatus(id: string, status: RankingStatus): Promise<Ranking | null> {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await RankingModel.findByIdAndUpdate(id, { $set: { status } }, { returnDocument: "after" });
      return doc ? serializeRanking(doc) : null;
    },

    async deletePeriodRankings(period: string): Promise<number> {
      const result = await RankingModel.deleteMany({ period });
      return result.deletedCount;
    }
  };
}

export type RankingRepository = ReturnType<typeof createMongoRankingRepository>;
