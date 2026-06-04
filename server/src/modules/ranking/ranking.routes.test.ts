import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, UserRepository } from "../auth/auth.service.js";
import { SeriesModel } from "../series/series.model.js";
import { RankingModel } from "./ranking.model.js";
import type { Ranking, RankingRepository } from "./ranking.repository.js";

// Mock SeriesModel and RankingModel
vi.mock("../series/series.model.js", () => ({
  SeriesModel: {
    find: vi.fn(),
    exists: vi.fn(),
    findById: vi.fn()
  }
}));

vi.mock("./ranking.model.js", () => ({
  RankingModel: {
    findOneAndUpdate: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    deleteMany: vi.fn()
  }
}));

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439050";
const boardId = "507f1f77bcf86cd799439051";
const adminId = "507f1f77bcf86cd799439052";
const mangakaId = "507f1f77bcf86cd799439053";
const assistantId = "507f1f77bcf86cd799439054";

function createAuthUser(id: string, systemRole: "BOARD" | "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR"): AuthUser {
  return {
    id,
    email: `${id}@example.com`,
    fullName: id,
    avatarUrl: null,
    systemRole,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

const boardUser = createAuthUser(boardId, "BOARD");
const adminUser = createAuthUser(adminId, "ADMIN");
const mangakaUser = createAuthUser(mangakaId, "MANGAKA");
const assistantUser = createAuthUser(assistantId, "ASSISTANT");

const users = [boardUser, adminUser, mangakaUser, assistantUser];

function createVerifier(id: string): AuthVerifier {
  const user = users.find(u => u.id === id);
  return {
    async verify() {
      return {
        sub: id,
        systemRole: user?.systemRole ?? null,
        status: user?.status ?? "ACTIVE"
      };
    },
    async verifyWithProfile() {
      return { sub: id, email: "test@example.com", fullName: id, avatarUrl: null };
    }
  };
}

function createUserRepository(): UserRepository {
  const byId = new Map(users.map((u) => [u.id, u]));
  return {
    async findById(id) {
      return byId.get(id) ?? null;
    },
    async upsertFromProfile() { throw new Error("Not implemented"); },
    async updateOnboarding() { throw new Error("Not implemented"); },
    async listUsersForRoleReview() { return []; },
    async assignSystemRole() { throw new Error("Not implemented"); },
    async updateUserStatus() { throw new Error("Not implemented"); }
  };
}

function createMockRankingRepository(seedRankings: Ranking[] = []) {
  const rankings = new Map(seedRankings.map((r) => [r.id, r]));

  const repository: RankingRepository = {
    async createOrUpdateRanking(data) {
      const existing = [...rankings.values()].find(
        (r) => r.period === data.period && r.seriesId === data.seriesId
      );
      if (existing) {
        Object.assign(existing, data);
        existing.updatedAt = now;
        return existing;
      }
      const id = `ranking_${rankings.size + 1}`;
      const ranking: Ranking = {
        id,
        ...data,
        createdAt: now,
        updatedAt: now
      };
      rankings.set(id, ranking);
      return ranking;
    },
    async findRankingById(id) {
      return rankings.get(id) ?? null;
    },
    async findRankingsByPeriod(period) {
      return [...rankings.values()]
        .filter((r) => r.period === period)
        .sort((a, b) => a.rank - b.rank);
    },
    async findRankingsBySeries(seriesId) {
      return [...rankings.values()]
        .filter((r) => r.seriesId === seriesId)
        .sort((a, b) => a.period.localeCompare(b.period));
    },
    async findOneRankingByPeriodAndSeries(period, seriesId) {
      return [...rankings.values()].find((r) => r.period === period && r.seriesId === seriesId) ?? null;
    },
    async updateRankingStatus(id, status) {
      const ranking = rankings.get(id);
      if (!ranking) return null;
      ranking.status = status;
      ranking.updatedAt = now;
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

  return { repository, rankings };
}

function createRankingApp(userId: string, seedRankings: Ranking[] = []) {
  const { repository: rankingRepository } = createMockRankingRepository(seedRankings);
  const app = createApp({
    authVerifier: createVerifier(userId),
    userRepository: createUserRepository(),
    rankingRepository
  });
  return { app };
}

describe("ranking routes integration tests", () => {
  it("POST /api/rankings/import - succeeds for BOARD/ADMIN and sets ranks, denies MANGAKA", async () => {
    // 1. Succeeds for BOARD
    vi.mocked(SeriesModel.find).mockResolvedValue([{ _id: seriesId }] as any);
    const { app: appBoard } = createRankingApp(boardUser.id);

    const response = await request(appBoard)
      .post("/api/rankings/import")
      .set("Authorization", "Bearer valid")
      .send({
        period: "2026-W22",
        items: [{ seriesId, voteCount: 100, readerScore: 8 }]
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0]).toMatchObject({
      seriesId,
      period: "2026-W22",
      voteCount: 100,
      readerScore: 8,
      finalScore: 94,
      rank: 1,
      status: "NORMAL"
    });

    // 2. Denies MANGAKA
    const { app: appMangaka } = createRankingApp(mangakaUser.id);
    const resDeny = await request(appMangaka)
      .post("/api/rankings/import")
      .set("Authorization", "Bearer valid")
      .send({
        period: "2026-W22",
        items: [{ seriesId, voteCount: 100, readerScore: 8 }]
      });
    expect(resDeny.status).toBe(403);
  });

  it("GET /api/rankings?period=2026-W22 - succeeds for BOARD, denies MANGAKA", async () => {
    const ranking: Ranking = {
      id: "rank_1",
      seriesId,
      period: "2026-W22",
      voteCount: 100,
      readerScore: 8,
      normalizedReaderScore: 80,
      finalScore: 94,
      rank: 1,
      status: "NORMAL",
      createdBy: boardId,
      createdAt: now,
      updatedAt: now
    };

    // 1. BOARD succeeds
    const { app: appBoard } = createRankingApp(boardUser.id, [ranking]);
    const response = await request(appBoard)
      .get("/api/rankings?period=2026-W22")
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].seriesId).toBe(seriesId);

    // 2. MANGAKA denies
    const { app: appMangaka } = createRankingApp(mangakaUser.id, [ranking]);
    const resDeny = await request(appMangaka)
      .get("/api/rankings?period=2026-W22")
      .set("Authorization", "Bearer valid");
    expect(resDeny.status).toBe(403);
  });

  it("GET /api/series/:seriesId/rankings - allows Series Owner, BOARD, ADMIN, denies strangers", async () => {
    const ranking: Ranking = {
      id: "rank_1",
      seriesId,
      period: "2026-W22",
      voteCount: 100,
      readerScore: 8,
      normalizedReaderScore: 80,
      finalScore: 94,
      rank: 1,
      status: "NORMAL",
      createdBy: boardId,
      createdAt: now,
      updatedAt: now
    };

    const findSpy = vi.spyOn(SeriesModel, "findById").mockResolvedValue({ id: seriesId, ownerId: mangakaId } as any);
    const existsSpy = vi.spyOn(SeriesModel, "exists").mockResolvedValue(true as any);

    // 1. Series Owner succeeds
    const { app: appOwner } = createRankingApp(mangakaUser.id, [ranking]);
    const resOwner = await request(appOwner)
      .get(`/api/series/${seriesId}/rankings`)
      .set("Authorization", "Bearer valid");
    expect(resOwner.status).toBe(200);
    expect(resOwner.body.data).toHaveLength(1);

    // 2. BOARD succeeds
    const { app: appBoard } = createRankingApp(boardUser.id, [ranking]);
    const resBoard = await request(appBoard)
      .get(`/api/series/${seriesId}/rankings`)
      .set("Authorization", "Bearer valid");
    expect(resBoard.status).toBe(200);

    // 3. Stranger (assistant) is forbidden
    const { app: appStranger } = createRankingApp(assistantUser.id, [ranking]);
    const resStranger = await request(appStranger)
      .get(`/api/series/${seriesId}/rankings`)
      .set("Authorization", "Bearer valid");
    expect(resStranger.status).toBe(403);

    findSpy.mockRestore();
    existsSpy.mockRestore();
  });

  it("POST /api/rankings/:rankingId/mark-warning and mark-at-risk - modifies risk status for board/admin", async () => {
    const ranking: Ranking = {
      id: "rank_1",
      seriesId,
      period: "2026-W22",
      voteCount: 100,
      readerScore: 8,
      normalizedReaderScore: 80,
      finalScore: 94,
      rank: 1,
      status: "NORMAL",
      createdBy: boardId,
      createdAt: now,
      updatedAt: now
    };

    const { app } = createRankingApp(boardUser.id, [ranking]);

    // 1. mark-warning
    const resWarning = await request(app)
      .post(`/api/rankings/rank_1/mark-warning`)
      .set("Authorization", "Bearer valid");

    expect(resWarning.status).toBe(200);
    expect(resWarning.body.data.status).toBe("WARNING");

    // 2. mark-at-risk
    const resAtRisk = await request(app)
      .post(`/api/rankings/rank_1/mark-at-risk`)
      .set("Authorization", "Bearer valid");

    expect(resAtRisk.status).toBe(200);
    expect(resAtRisk.body.data.status).toBe("AT_RISK");
  });
});

