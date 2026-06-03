import type { RankingRepository, Ranking } from "./ranking.repository.js";
import { SeriesModel } from "../series/series.model.js";
import { getPreviousPeriod } from "./ranking.helper.js";

export class RankingServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export function createRankingService(rankingRepository: RankingRepository) {
  return {
    async importAndCalculateRankings(
      userId: string,
      period: string,
      items: Array<{ seriesId: string; voteCount: number; readerScore: number }>
    ): Promise<Ranking[]> {
      if (!period) throw new RankingServiceError("PERIOD_REQUIRED", "Period is required");
      if (!/^\d{4}-W\d{2}$/.test(period)) {
        throw new RankingServiceError("INVALID_PERIOD_FORMAT", "Period must be in YYYY-Www format");
      }
      if (!items || !Array.isArray(items)) {
        throw new RankingServiceError("ITEMS_REQUIRED", "Items array is required");
      }

      // 1. Validate reader scores
      for (const item of items) {
        if (!item.seriesId) {
          throw new RankingServiceError("SERIES_ID_REQUIRED", "Series ID is required for all items");
        }
        if (typeof item.voteCount !== "number" || item.voteCount < 0) {
          throw new RankingServiceError("INVALID_VOTE_COUNT", `Vote count must be a non-negative number for series ${item.seriesId}`);
        }
        if (typeof item.readerScore !== "number" || item.readerScore < 1 || item.readerScore > 10) {
          throw new RankingServiceError("INVALID_READER_SCORE", `Reader score must be between 1 and 10 for series ${item.seriesId}`);
        }
      }

      // 2. Validate series existence
      const seriesIds = items.map(item => item.seriesId);
      const uniqueSeriesIds = [...new Set(seriesIds)];
      if (uniqueSeriesIds.length !== seriesIds.length) {
        throw new RankingServiceError("DUPLICATE_SERIES_IN_IMPORT", "Duplicate series entries in import list");
      }

      const seriesList = await SeriesModel.find({ _id: { $in: uniqueSeriesIds } });
      if (seriesList.length !== uniqueSeriesIds.length) {
        throw new RankingServiceError("SERIES_NOT_FOUND", "One or more series do not exist");
      }

      // 3. Compute scores and sort
      const calculatedItems = items.map(item => {
        const normalizedReaderScore = item.readerScore * 10;
        const finalScore = (item.voteCount * 0.7) + (normalizedReaderScore * 0.3);
        return {
          ...item,
          normalizedReaderScore,
          finalScore
        };
      });

      // Sort descending by finalScore, then by voteCount descending, then seriesId ascending
      calculatedItems.sort((a, b) => {
        if (b.finalScore !== a.finalScore) {
          return b.finalScore - a.finalScore;
        }
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount;
        }
        return String(a.seriesId).localeCompare(String(b.seriesId));
      });

      // Get previous period rankings to determine previous rank
      const prevPeriod = getPreviousPeriod(period);
      const prevRankings = prevPeriod
        ? await rankingRepository.findRankingsByPeriod(prevPeriod)
        : [];
      const prevRankMap = new Map<string, number>();
      for (const pr of prevRankings) {
        prevRankMap.set(pr.seriesId, pr.rank);
      }

      // 4. Delete existing rankings for the period
      await rankingRepository.deletePeriodRankings(period);

      // 5. Save new rankings
      const results: Ranking[] = [];
      for (let i = 0; i < calculatedItems.length; i++) {
        const item = calculatedItems[i];
        const rank = i + 1;
        const previousRank = prevRankMap.get(item.seriesId);

        const ranking = await rankingRepository.createOrUpdateRanking({
          seriesId: item.seriesId,
          period,
          voteCount: item.voteCount,
          readerScore: item.readerScore,
          normalizedReaderScore: item.normalizedReaderScore,
          finalScore: item.finalScore,
          rank,
          previousRank,
          status: "NORMAL",
          createdBy: userId
        });
        results.push(ranking);
      }

      return results;
    },

    async getRankingsByPeriod(period: string): Promise<Ranking[]> {
      if (!period) throw new RankingServiceError("PERIOD_REQUIRED", "Period is required");
      return rankingRepository.findRankingsByPeriod(period);
    },

    async getSeriesRankings(seriesId: string): Promise<Ranking[]> {
      if (!seriesId) throw new RankingServiceError("SERIES_ID_REQUIRED", "Series ID is required");
      const seriesExists = await SeriesModel.exists({ _id: seriesId });
      if (!seriesExists) {
        throw new RankingServiceError("SERIES_NOT_FOUND", "Series not found", 404);
      }
      return rankingRepository.findRankingsBySeries(seriesId);
    },

    async updateStatus(rankingId: string, status: "NORMAL" | "WARNING" | "AT_RISK"): Promise<Ranking> {
      if (!rankingId) throw new RankingServiceError("RANKING_ID_REQUIRED", "Ranking ID is required");
      const updated = await rankingRepository.updateRankingStatus(rankingId, status);
      if (!updated) {
        throw new RankingServiceError("RANKING_NOT_FOUND", "Ranking record not found", 404);
      }
      return updated;
    }
  };
}

export type RankingService = ReturnType<typeof createRankingService>;
