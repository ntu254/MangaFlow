import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, UserRepository } from "../auth/auth.service.js";
import { SeriesModel } from "../series/series.model.js";
import { ManuscriptModel } from "../manuscript/manuscript.model.js";
import type { BoardMember, BoardVote, BoardDecision } from "./board.repository.js";

// Mock Mongoose models used in routing/services
vi.mock("../series/series.model.js", () => ({
  SeriesModel: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(() => Promise.resolve({}))
  }
}));

vi.mock("../manuscript/manuscript.model.js", () => {
  const mockManuscript = {
    status: "BOARD_REVIEW",
    save: vi.fn(() => Promise.resolve({}))
  };
  return {
    ManuscriptModel: {
      findOne: vi.fn(() => ({
        sort: vi.fn(() => Promise.resolve(mockManuscript))
      }))
    }
  };
});

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439050";
const chairId = "507f1f77bcf86cd799439051";
const memberId = "507f1f77bcf86cd799439052";
const inactiveId = "507f1f77bcf86cd799439053";
const adminId = "507f1f77bcf86cd799439054";
const mangakaId = "507f1f77bcf86cd799439055";
const assistantId = "507f1f77bcf86cd799439056";

function createAuthUser(clerkId: string, id: string, systemRole: "BOARD" | "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR"): AuthUser {
  return {
    id,
    clerkId,
    email: `${clerkId}@example.com`,
    fullName: clerkId,
    avatarUrl: null,
    systemRole,
    requestedSystemRole: null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

const chairUser = createAuthUser("clerk_chair", chairId, "BOARD");
const memberUser = createAuthUser("clerk_member", memberId, "BOARD");
const inactiveUser = createAuthUser("clerk_inactive", inactiveId, "BOARD");
const adminUser = createAuthUser("clerk_admin", adminId, "ADMIN");
const mangakaUser = createAuthUser("clerk_mangaka", mangakaId, "MANGAKA");
const assistantUser = createAuthUser("clerk_assistant", assistantId, "ASSISTANT");

const users = [chairUser, memberUser, inactiveUser, adminUser, mangakaUser, assistantUser];

function createVerifier(clerkId: string): AuthVerifier {
  const user = users.find(u => u.clerkId === clerkId);
  return {
    async verify() {
      return {
        clerkId,
        systemRole: user?.systemRole ?? null,
        status: user?.status ?? "ACTIVE"
      };
    },
    async verifyWithProfile() {
      return { clerkId, email: "test@example.com", fullName: clerkId, avatarUrl: null };
    }
  };
}

function createUserRepository(): UserRepository {
  const byClerkId = new Map(users.map((u) => [u.clerkId, u]));
  const byId = new Map(users.map((u) => [u.id, u]));
  return {
    async findByClerkId(clerkId) {
      return byClerkId.get(clerkId) ?? null;
    },
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

function createBoardRepository(
  seedMembers: BoardMember[] = [],
  seedVotes: BoardVote[] = [],
  seedDecisions: BoardDecision[] = []
) {
  const members = new Map(seedMembers.map((m) => [m.id, m]));
  const votes = new Map(seedVotes.map((v) => [v.id, v]));
  const decisions = new Map(seedDecisions.map((d) => [d.id, d]));

  const repository = {
    async createBoardMember(userId: string, role: "BOARD_MEMBER" | "BOARD_CHAIR", status: "ACTIVE" | "INACTIVE" = "ACTIVE") {
      const id = `member_${members.size + 1}`;
      const m: BoardMember = {
        id,
        userId,
        role,
        status,
        createdAt: now,
        updatedAt: now
      };
      members.set(id, m);
      return m;
    },
    async findBoardMemberById(id: string) {
      return members.get(id) ?? null;
    },
    async findBoardMemberByUserId(userId: string) {
      return [...members.values()].find((m) => m.userId === userId) ?? null;
    },
    async listBoardMembers() {
      return [...members.values()];
    },
    async createOrUpdateVote(seriesId: string, boardMemberId: string, vote: "APPROVE" | "REJECT" | "NEEDS_REVISION", reason?: string) {
      const existing = [...votes.values()].find((v) => v.seriesId === seriesId && v.boardMemberId === boardMemberId);
      if (existing) {
        existing.vote = vote;
        if (reason !== undefined) existing.reason = reason;
        existing.updatedAt = now;
        return existing;
      }
      const id = `vote_${votes.size + 1}`;
      const v: BoardVote = {
        id,
        seriesId,
        boardMemberId,
        vote,
        reason,
        createdAt: now,
        updatedAt: now
      };
      votes.set(id, v);
      return v;
    },
    async findVotesBySeries(seriesId: string) {
      return [...votes.values()].filter((v) => v.seriesId === seriesId);
    },
    async createDecision(
      seriesId: string,
      decision: "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "CONTINUE" | "CANCEL",
      voteSummary: { approve: number; reject: number; needsRevision: number },
      decidedBy: string,
      isTieBreak: boolean,
      reason?: string
    ) {
      const id = `decision_${decisions.size + 1}`;
      const d: BoardDecision = {
        id,
        seriesId,
        decision,
        voteSummary,
        decidedBy,
        isTieBreak,
        reason,
        createdAt: now,
        updatedAt: now
      };
      decisions.set(id, d);
      return d;
    },
    async findDecisionBySeries(seriesId: string) {
      return [...decisions.values()].find((d) => d.seriesId === seriesId) ?? null;
    }
  };

  return { repository, members, votes, decisions };
}

function createBoardApp(
  clerkId: string,
  seedMembers: BoardMember[] = [],
  seedVotes: BoardVote[] = [],
  seedDecisions: BoardDecision[] = []
) {
  const { repository: boardRepository } = createBoardRepository(seedMembers, seedVotes, seedDecisions);
  const app = createApp({
    authVerifier: createVerifier(clerkId),
    userRepository: createUserRepository(),
    boardRepository
  });
  return { app };
}

describe("board routes integration tests", () => {
  const memberChair: BoardMember = { id: "bm_chair", userId: chairId, role: "BOARD_CHAIR", status: "ACTIVE", createdAt: now, updatedAt: now };
  const memberRegular: BoardMember = { id: "bm_member", userId: memberId, role: "BOARD_MEMBER", status: "ACTIVE", createdAt: now, updatedAt: now };
  const memberInactive: BoardMember = { id: "bm_inactive", userId: inactiveId, role: "BOARD_MEMBER", status: "INACTIVE", createdAt: now, updatedAt: now };
  const defaultMembers = [memberChair, memberRegular, memberInactive];

  it("GET /api/board/members - returns board members for BOARD/ADMIN users", async () => {
    const { app } = createBoardApp(memberUser.clerkId, defaultMembers);

    const response = await request(app)
      .get("/api/board/members")
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data[0]).toMatchObject({
      userId: chairId,
      role: "BOARD_CHAIR",
      status: "ACTIVE"
    });
  });

  it("GET /api/board/members - denies access to MANGAKA role", async () => {
    const { app } = createBoardApp(mangakaUser.clerkId, defaultMembers);

    const response = await request(app)
      .get("/api/board/members")
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("POST /api/board/:seriesId/votes - submits vote for active board member", async () => {
    const findSpy = vi.spyOn(SeriesModel, "findById").mockResolvedValue({ id: seriesId } as any);
    const { app } = createBoardApp(memberUser.clerkId, defaultMembers);

    const response = await request(app)
      .post(`/api/board/${seriesId}/votes`)
      .set("Authorization", "Bearer valid")
      .send({ vote: "APPROVE", reason: "Superb plot" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      seriesId,
      boardMemberId: "bm_member",
      vote: "APPROVE",
      reason: "Superb plot"
    });

    findSpy.mockRestore();
  });

  it("POST /api/board/:seriesId/votes - denies vote for inactive board member", async () => {
    const findSpy = vi.spyOn(SeriesModel, "findById").mockResolvedValue({ id: seriesId } as any);
    const { app } = createBoardApp(inactiveUser.clerkId, defaultMembers);

    const response = await request(app)
      .post(`/api/board/${seriesId}/votes`)
      .set("Authorization", "Bearer valid")
      .send({ vote: "APPROVE" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("NOT_ACTIVE_MEMBER");

    findSpy.mockRestore();
  });

  it("GET /api/board/:seriesId/votes - allows BOARD and Series Owner, denies strangers", async () => {
    const findSpy = vi.spyOn(SeriesModel, "findById").mockResolvedValue({ id: seriesId, ownerId: mangakaId } as any);
    const vote: BoardVote = { id: "v1", seriesId, boardMemberId: "bm_member", vote: "APPROVE", createdAt: now, updatedAt: now };

    // 1. BOARD user -> succeeds
    const appBoard = createBoardApp(memberUser.clerkId, defaultMembers, [vote]).app;
    const resBoard = await request(appBoard)
      .get(`/api/board/${seriesId}/votes`)
      .set("Authorization", "Bearer valid");
    expect(resBoard.status).toBe(200);
    expect(resBoard.body.data).toHaveLength(1);

    // 2. Mangaka Owner -> succeeds
    const appOwner = createBoardApp(mangakaUser.clerkId, defaultMembers, [vote]).app;
    const resOwner = await request(appOwner)
      .get(`/api/board/${seriesId}/votes`)
      .set("Authorization", "Bearer valid");
    expect(resOwner.status).toBe(200);

    // 3. Assistant Stranger -> denies
    const appStranger = createBoardApp(assistantUser.clerkId, defaultMembers, [vote]).app;
    const resStranger = await request(appStranger)
      .get(`/api/board/${seriesId}/votes`)
      .set("Authorization", "Bearer valid");
    expect(resStranger.status).toBe(403);

    findSpy.mockRestore();
  });

  it("GET /api/board/:seriesId/votes/summary - returns vote summary", async () => {
    const votes: BoardVote[] = [
      { id: "v1", seriesId, boardMemberId: "bm1", vote: "APPROVE", createdAt: now, updatedAt: now },
      { id: "v2", seriesId, boardMemberId: "bm2", vote: "APPROVE", createdAt: now, updatedAt: now },
      { id: "v3", seriesId, boardMemberId: "bm3", vote: "REJECT", createdAt: now, updatedAt: now }
    ];
    const { app } = createBoardApp(memberUser.clerkId, defaultMembers, votes);

    const response = await request(app)
      .get(`/api/board/${seriesId}/votes/summary`)
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      approve: 2,
      reject: 1,
      needsRevision: 0,
      totalVotes: 3
    });
  });

  it("POST /api/board/:seriesId/decisions/finalize - handles majority decision and tie scenario", async () => {
    // Scenario A: Majority exists
    const votesApprove: BoardVote[] = [
      { id: "v1", seriesId, boardMemberId: "bm1", vote: "APPROVE", createdAt: now, updatedAt: now },
      { id: "v2", seriesId, boardMemberId: "bm2", vote: "APPROVE", createdAt: now, updatedAt: now },
      { id: "v3", seriesId, boardMemberId: "bm3", vote: "REJECT", createdAt: now, updatedAt: now }
    ];

    const appChair = createBoardApp(chairUser.clerkId, defaultMembers, votesApprove).app;
    const resFinalize = await request(appChair)
      .post(`/api/board/${seriesId}/decisions/finalize`)
      .set("Authorization", "Bearer valid");

    expect(resFinalize.status).toBe(200);
    expect(resFinalize.body.data.decision).toBe("APPROVED");
    expect(resFinalize.body.data.isTieBreak).toBe(false);

    // Scenario B: Tie decision required
    const votesTie: BoardVote[] = [
      { id: "v1", seriesId, boardMemberId: "bm1", vote: "APPROVE", createdAt: now, updatedAt: now },
      { id: "v2", seriesId, boardMemberId: "bm2", vote: "REJECT", createdAt: now, updatedAt: now }
    ];
    const appTie = createBoardApp(chairUser.clerkId, defaultMembers, votesTie).app;
    const resTie = await request(appTie)
      .post(`/api/board/${seriesId}/decisions/finalize`)
      .set("Authorization", "Bearer valid");

    expect(resTie.status).toBe(400);
    expect(resTie.body.code).toBe("TIE_BREAK_REQUIRED");
  });

  it("POST /api/board/:seriesId/decisions/tie-break - lets Board Chair tie-break, denies others", async () => {
    const votesTie: BoardVote[] = [
      { id: "v1", seriesId, boardMemberId: "bm1", vote: "APPROVE", createdAt: now, updatedAt: now },
      { id: "v2", seriesId, boardMemberId: "bm2", vote: "REJECT", createdAt: now, updatedAt: now }
    ];

    // 1. Board Chair -> succeeds
    const appChair = createBoardApp(chairUser.clerkId, defaultMembers, votesTie).app;
    const resChair = await request(appChair)
      .post(`/api/board/${seriesId}/decisions/tie-break`)
      .set("Authorization", "Bearer valid")
      .send({ decision: "REJECTED", reason: "Tie break casting vote" });

    expect(resChair.status).toBe(200);
    expect(resChair.body.data).toMatchObject({
      decision: "REJECTED",
      isTieBreak: true,
      reason: "Tie break casting vote",
      decidedBy: chairId
    });

    // 2. Regular member -> denies (403)
    const appMember = createBoardApp(memberUser.clerkId, defaultMembers, votesTie).app;
    const resMember = await request(appMember)
      .post(`/api/board/${seriesId}/decisions/tie-break`)
      .set("Authorization", "Bearer valid")
      .send({ decision: "APPROVED", reason: "Trying to hijack" });

    expect(resMember.status).toBe(403);
  });
});

