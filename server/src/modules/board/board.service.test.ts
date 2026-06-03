import { describe, expect, it, vi, beforeEach } from "vitest";
import { createBoardService, BoardServiceError } from "./board.service.js";
import type { BoardRepository, BoardMember, BoardVote, BoardDecision } from "./board.repository.js";
import type { UserRepository, AuthUser } from "../auth/auth.service.js";
import { SeriesModel } from "../series/series.model.js";
import { ManuscriptModel } from "../manuscript/manuscript.model.js";

// Mock Mongoose models used in service transitions
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

function createRepositories(
  seedMembers: BoardMember[] = [],
  seedVotes: BoardVote[] = [],
  seedDecisions: BoardDecision[] = [],
  seedUsers: AuthUser[] = []
) {
  const members = new Map(seedMembers.map((m) => [m.id, m]));
  const votes = new Map(seedVotes.map((v) => [v.id, v]));
  const decisions = new Map(seedDecisions.map((d) => [d.id, d]));
  const users = new Map(seedUsers.map((u) => [u.id, u]));

  const boardRepository: BoardRepository = {
    async createBoardMember(userId, role, status = "ACTIVE") {
      const id = `member_${members.size + 1}`;
      const m: BoardMember = {
        id,
        userId,
        role,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      members.set(id, m);
      return m;
    },
    async findBoardMemberById(id) {
      return members.get(id) ?? null;
    },
    async findBoardMemberByUserId(userId) {
      return [...members.values()].find((m) => m.userId === userId) ?? null;
    },
    async listBoardMembers() {
      return [...members.values()];
    },
    async createOrUpdateVote(seriesId, boardMemberId, vote, reason) {
      const existing = [...votes.values()].find((v) => v.seriesId === seriesId && v.boardMemberId === boardMemberId);
      if (existing) {
        existing.vote = vote;
        existing.reason = reason;
        existing.updatedAt = new Date().toISOString();
        return existing;
      }
      const id = `vote_${votes.size + 1}`;
      const v: BoardVote = {
        id,
        seriesId,
        boardMemberId,
        vote,
        reason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      votes.set(id, v);
      return v;
    },
    async findVotesBySeries(seriesId) {
      return [...votes.values()].filter((v) => v.seriesId === seriesId);
    },
    async createDecision(seriesId, decision, voteSummary, decidedBy, isTieBreak, reason) {
      const id = `decision_${decisions.size + 1}`;
      const d: BoardDecision = {
        id,
        seriesId,
        decision,
        voteSummary,
        decidedBy,
        isTieBreak,
        reason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      decisions.set(id, d);
      return d;
    },
    async findDecisionBySeries(seriesId) {
      return [...decisions.values()].find((d) => d.seriesId === seriesId) ?? null;
    }
  };

  const userRepository: UserRepository = {
    async findById(id) {
      return users.get(id) ?? null;
    },
    async findByClerkId(clerkId) {
      return [...users.values()].find((u) => u.clerkId === clerkId) ?? null;
    },
    async upsertFromClerk() { throw new Error("Not implemented"); },
    async updateOnboarding() { throw new Error("Not implemented"); },
    async listUsersForRoleReview() { return []; },
    async assignSystemRole() { throw new Error("Not implemented"); },
    async updateUserStatus() { throw new Error("Not implemented"); }
  };

  return { boardRepository, userRepository, members, votes, decisions, users };
}

describe("board service unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a board member", async () => {
    const user: AuthUser = {
      id: "u1",
      clerkId: "c1",
      email: "b1@test.com",
      fullName: "Board Member 1",
      avatarUrl: null,
      systemRole: "BOARD",
      requestedSystemRole: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const { boardRepository, userRepository } = createRepositories([], [], [], [user]);
    const service = createBoardService(boardRepository, userRepository);

    const m = await service.registerBoardMember("u1", "BOARD_MEMBER");
    expect(m).toMatchObject({
      userId: "u1",
      role: "BOARD_MEMBER",
      status: "ACTIVE"
    });
  });

  it("prevents double-registering or registering non-board role users", async () => {
    const userBoard: AuthUser = {
      id: "u1",
      clerkId: "c1",
      email: "b1@test.com",
      fullName: "Board Member 1",
      avatarUrl: null,
      systemRole: "BOARD",
      requestedSystemRole: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const userMangaka: AuthUser = {
      id: "u2",
      clerkId: "c2",
      email: "m1@test.com",
      fullName: "Mangaka 1",
      avatarUrl: null,
      systemRole: "MANGAKA",
      requestedSystemRole: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { boardRepository, userRepository } = createRepositories([], [], [], [userBoard, userMangaka]);
    const service = createBoardService(boardRepository, userRepository);

    // Fails for Mangaka role
    await expect(service.registerBoardMember("u2", "BOARD_MEMBER")).rejects.toMatchObject({
      code: "INVALID_SYSTEM_ROLE"
    });

    // Succeeds first time
    await service.registerBoardMember("u1", "BOARD_MEMBER");

    // Fails second time
    await expect(service.registerBoardMember("u1", "BOARD_MEMBER")).rejects.toMatchObject({
      code: "ALREADY_BOARD_MEMBER"
    });
  });

  it("submits and updates a vote", async () => {
    const user: AuthUser = {
      id: "u1",
      clerkId: "c1",
      email: "b1@test.com",
      fullName: "Board Member 1",
      avatarUrl: null,
      systemRole: "BOARD",
      requestedSystemRole: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const member: BoardMember = {
      id: "bm1",
      userId: "u1",
      role: "BOARD_MEMBER",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const { boardRepository, userRepository } = createRepositories([member], [], [], [user]);
    const service = createBoardService(boardRepository, userRepository);

    // Mock Series findById
    const seriesFindSpy = vi.spyOn(SeriesModel, "findById").mockResolvedValue({ id: "s1" } as any);

    const vote1 = await service.submitVote("u1", "s1", "APPROVE", "Looks great");
    expect(vote1).toMatchObject({
      seriesId: "s1",
      boardMemberId: "bm1",
      vote: "APPROVE",
      reason: "Looks great"
    });

    const vote2 = await service.submitVote("u1", "s1", "REJECT", "Changed my mind");
    expect(vote2.vote).toBe("REJECT");
    expect(vote2.reason).toBe("Changed my mind");

    seriesFindSpy.mockRestore();
  });

  it("calculates simple majority correctly and blocks finalization on ties", async () => {
    const chairUser: AuthUser = {
      id: "u_chair",
      clerkId: "c_chair",
      email: "chair@test.com",
      fullName: "Chair User",
      avatarUrl: null,
      systemRole: "BOARD",
      requestedSystemRole: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const chairMember: BoardMember = {
      id: "bm_chair",
      userId: "u_chair",
      role: "BOARD_CHAIR",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const { boardRepository, userRepository } = createRepositories([chairMember], [], [], [chairUser]);
    const service = createBoardService(boardRepository, userRepository);

    // Mock vote summary to be a tie
    const getSummarySpy = vi.spyOn(service, "getVoteSummary").mockResolvedValue({
      approve: 2,
      reject: 2,
      needsRevision: 0,
      totalVotes: 4
    });

    await expect(service.finalizeDecision("s1", "u_chair")).rejects.toMatchObject({
      code: "TIE_BREAK_REQUIRED"
    });

    // Mock vote summary to have a clear majority of APPROVE
    getSummarySpy.mockResolvedValue({
      approve: 3,
      reject: 1,
      needsRevision: 0,
      totalVotes: 4
    });

    const dec = await service.finalizeDecision("s1", "u_chair");
    expect(dec.decision).toBe("APPROVED");
    expect(dec.isTieBreak).toBe(false);

    getSummarySpy.mockRestore();
  });

  it("allows board chair to execute a tie-break", async () => {
    const chairUser: AuthUser = {
      id: "u_chair",
      clerkId: "c_chair",
      email: "chair@test.com",
      fullName: "Chair User",
      avatarUrl: null,
      systemRole: "BOARD",
      requestedSystemRole: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const chairMember: BoardMember = {
      id: "bm_chair",
      userId: "u_chair",
      role: "BOARD_CHAIR",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const regularUser: AuthUser = {
      id: "u_reg",
      clerkId: "c_reg",
      email: "reg@test.com",
      fullName: "Regular User",
      avatarUrl: null,
      systemRole: "BOARD",
      requestedSystemRole: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const regularMember: BoardMember = {
      id: "bm_reg",
      userId: "u_reg",
      role: "BOARD_MEMBER",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { boardRepository, userRepository } = createRepositories([chairMember, regularMember], [], [], [chairUser, regularUser]);
    const service = createBoardService(boardRepository, userRepository);

    // Non-chair cannot tie-break
    await expect(service.finalizeTieBreak("s1", "u_reg", "APPROVED", "My tie break vote")).rejects.toMatchObject({
      code: "FORBIDDEN"
    });

    // Chair tie-breaks successfully
    const dec = await service.finalizeTieBreak("s1", "u_chair", "APPROVED", "Casting chair tie break");
    expect(dec.decision).toBe("APPROVED");
    expect(dec.isTieBreak).toBe(true);
    expect(dec.reason).toBe("Casting chair tie break");
  });
});
