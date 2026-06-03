import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRankingService, RankingServiceError } from "./ranking.service.js";
import type { RankingRepository, Ranking } from "./ranking.repository.js";
import { SeriesModel } from "../series/series.model.js";

// Mock SeriesModel
vi.mock("../series/series.model.js", () => ({
  SeriesModel: {
    find: vi.fn(),
    exists: vi.fn()
  }
}));

function createInMemoryRankingRepository(seedRankings: Ranking[] = []) {
  const rankings = new Map<string, Ranking>(seedRankings.map(r => [r.id, r]));

  const rankingRepository: RankingRepository = {
    async createOrUpdateRanking(data) {
      // Find existing
      const existing = [...rankings.values()].find(
        r => r.period === data.period && r.seriesId === data.seriesId
      );
      if (existing) {
        Object.assign(existing, data);
        existing.updatedAt = new Date().toISOString();
        return existing;
      }
      const id = `ranking_${rankings.size + 1}`;
      const ranking: Ranking = {
        id,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      rankings.set(id, ranking);
      return ranking;
    },

    async findRankingById(id) {
      return rankings.get(id) ?? null;
    },

    async findRankingsByPeriod(period) {
      return [...rankings.values()]
        .filter(r => r.period === period)
        .sort((a, b) => a.rank - b.rank);
    },

    async findRankingsBySeries(seriesId) {
      return [...rankings.values()]
        .filter(r => r.seriesId === seriesId)
        .sort((a, b) => a.period.localeCompare(b.period));
    },

    async findOneRankingByPeriodAndSeries(period, seriesId) {
      return [...rankings.values()].find(r => r.period === period && r.seriesId === seriesId) ?? null;
    },

    async updateRankingStatus(id, status) {
      const ranking = rankings.get(id);
      if (!ranking) return null;
      ranking.status = status;
      ranking.updatedAt = new Date().toISOString();
      return ranking;
    },

    async deletePeriodRankings(period) {
      let deleted = 0;
      for (const [id, r] of rankings.entries()) {
        if (r.period === period) {
          rankings.delete(id);
          deleted++;
        }
      }
      return deleted;
    }
  };

  return { rankingRepository, rankings };
}

describe("RankingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("importAndCalculateRankings", () => {
    it("should validate readerScore range and non-negative voteCount", async () => {
      const { rankingRepository } = createInMemoryRankingRepository();
      const service = createRankingService(rankingRepository);

      // Reader score too low
      try {
        await service.importAndCalculateRankings("user_1", "2026-W22", [
          { seriesId: "series_1", voteCount: 100, readerScore: 0.5 }
        ]);
        expect.fail("Should have failed");
      } catch (error) {
        expect(error).toBeInstanceOf(RankingServiceError);
        expect((error as RankingServiceError).code).toBe("INVALID_READER_SCORE");
      }

      // Reader score too high
      try {
        await service.importAndCalculateRankings("user_1", "2026-W22", [
          { seriesId: "series_1", voteCount: 100, readerScore: 11 }
        ]);
        expect.fail("Should have failed");
      } catch (error) {
        expect(error).toBeInstanceOf(RankingServiceError);
        expect((error as RankingServiceError).code).toBe("INVALID_READER_SCORE");
      }

      // Vote count negative
      try {
        await service.importAndCalculateRankings("user_1", "2026-W22", [
          { seriesId: "series_1", voteCount: -5, readerScore: 8 }
        ]);
        expect.fail("Should have failed");
      } catch (error) {
        expect(error).toBeInstanceOf(RankingServiceError);
        expect((error as RankingServiceError).code).toBe("INVALID_VOTE_COUNT");
      }
    });

    it("should throw if duplicate series in import items", async () => {
      const { rankingRepository } = createInMemoryRankingRepository();
      const service = createRankingService(rankingRepository);

      await expect(
        service.importAndCalculateRankings("user_1", "2026-W22", [
          { seriesId: "series_1", voteCount: 100, readerScore: 8 },
          { seriesId: "series_1", voteCount: 50, readerScore: 9 }
        ])
      ).rejects.toThrowError(new RankingServiceError("DUPLICATE_SERIES_IN_IMPORT", "Duplicate series entries in import list"));
    });

    it("should calculate correct normalized scores, final scores, and ranks", async () => {
      const { rankingRepository } = createInMemoryRankingRepository();
      const service = createRankingService(rankingRepository);

      // Mock Series existence checking
      vi.mocked(SeriesModel.find).mockResolvedValue([
        { _id: "series_1" },
        { _id: "series_2" },
        { _id: "series_3" }
      ] as any);

      // Import items:
      // series_1: voteCount=100, readerScore=8 -> finalScore = (100 * 0.7) + (80 * 0.3) = 70 + 24 = 94
      // series_2: voteCount=200, readerScore=6 -> finalScore = (200 * 0.7) + (60 * 0.3) = 140 + 18 = 158
      // series_3: voteCount=50, readerScore=10 -> finalScore = (50 * 0.7) + (100 * 0.3) = 35 + 30 = 65
      // Order should be: series_2 (1st, score 158), series_1 (2nd, score 94), series_3 (3rd, score 65)
      const result = await service.importAndCalculateRankings("user_1", "2026-W22", [
        { seriesId: "series_1", voteCount: 100, readerScore: 8 },
        { seriesId: "series_2", voteCount: 200, readerScore: 6 },
        { seriesId: "series_3", voteCount: 50, readerScore: 10 }
      ]);

      expect(result).toHaveLength(3);
      expect(result[0].seriesId).toBe("series_2");
      expect(result[0].rank).toBe(1);
      expect(result[0].finalScore).toBe(158);
      expect(result[0].normalizedReaderScore).toBe(60);

      expect(result[1].seriesId).toBe("series_1");
      expect(result[1].rank).toBe(2);
      expect(result[1].finalScore).toBe(94);
      expect(result[1].normalizedReaderScore).toBe(80);

      expect(result[2].seriesId).toBe("series_3");
      expect(result[2].rank).toBe(3);
      expect(result[2].finalScore).toBe(65);
      expect(result[2].normalizedReaderScore).toBe(100);
    });

    it("should handle tie-breaking with voteCount descending, then seriesId", async () => {
      const { rankingRepository } = createInMemoryRankingRepository();
      const service = createRankingService(rankingRepository);

      vi.mocked(SeriesModel.find).mockResolvedValue([
        { _id: "series_A" },
        { _id: "series_B" }
      ] as any);

      // both have finalScore = 100
      // series_A: voteCount=100, readerScore=10 -> finalScore = 70 + 30 = 100
      // series_B: voteCount=100, readerScore=10 -> finalScore = 70 + 30 = 100
      // Same finalScore, same voteCount, series_A < series_B so A should be rank 1, B rank 2
      const result = await service.importAndCalculateRankings("user_1", "2026-W22", [
        { seriesId: "series_B", voteCount: 100, readerScore: 10 },
        { seriesId: "series_A", voteCount: 100, readerScore: 10 }
      ]);

      expect(result[0].seriesId).toBe("series_A");
      expect(result[1].seriesId).toBe("series_B");
    });

    it("should resolve previousRank relative to previous period rankings", async () => {
      const { rankingRepository, rankings } = createInMemoryRankingRepository();
      const service = createRankingService(rankingRepository);

      // Seed previous period (2026-W21) rankings
      rankings.set("prev_1", {
        id: "prev_1",
        seriesId: "series_1",
        period: "2026-W21",
        voteCount: 100,
        readerScore: 8,
        normalizedReaderScore: 80,
        finalScore: 94,
        rank: 5,
        status: "NORMAL",
        createdBy: "user_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      vi.mocked(SeriesModel.find).mockResolvedValue([
        { _id: "series_1" }
      ] as any);

      const result = await service.importAndCalculateRankings("user_1", "2026-W22", [
        { seriesId: "series_1", voteCount: 120, readerScore: 9 }
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].seriesId).toBe("series_1");
      expect(result[0].previousRank).toBe(5);
    });
  });

  describe("updateStatus", () => {
    it("should update status successfully", async () => {
      const { rankingRepository, rankings } = createInMemoryRankingRepository();
      const service = createRankingService(rankingRepository);

      rankings.set("rank_1", {
        id: "rank_1",
        seriesId: "series_1",
        period: "2026-W22",
        voteCount: 100,
        readerScore: 8,
        normalizedReaderScore: 80,
        finalScore: 94,
        rank: 1,
        status: "NORMAL",
        createdBy: "user_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const updated = await service.updateStatus("rank_1", "WARNING");
      expect(updated.status).toBe("WARNING");
    });

    it("should throw if ranking record not found", async () => {
      const { rankingRepository } = createInMemoryRankingRepository();
      const service = createRankingService(rankingRepository);

      await expect(
        service.updateStatus("invalid_id", "AT_RISK")
      ).rejects.toThrowError(new RankingServiceError("RANKING_NOT_FOUND", "Ranking record not found", 404));
    });
  });
});
