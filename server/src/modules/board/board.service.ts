import mongoose from "mongoose";
import type { BoardRepository, BoardMember, BoardVote, BoardDecision } from "./board.repository.js";
import type { UserRepository } from "../auth/auth.service.js";
import { SeriesModel } from "../series/series.model.js";
import { ManuscriptModel } from "../manuscript/manuscript.model.js";
import type { BoardMemberRole, BoardMemberStatus, BoardVoteType, BoardDecisionType } from "./board.model.js";

export class BoardServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export function createBoardService(boardRepository: BoardRepository, userRepository: UserRepository) {
  async function transitionStatus(seriesId: string, decision: BoardDecisionType) {
    const manuscript = await ManuscriptModel.findOne({ seriesId, status: "BOARD_REVIEW" }).sort({ createdAt: -1 })
      || await ManuscriptModel.findOne({ seriesId }).sort({ createdAt: -1 });

    if (decision === "APPROVED") {
      await SeriesModel.findByIdAndUpdate(seriesId, { $set: { status: "APPROVED" } });
      if (manuscript) {
        manuscript.status = "APPROVED";
        await manuscript.save();
      }
    } else if (decision === "REJECTED") {
      await SeriesModel.findByIdAndUpdate(seriesId, { $set: { status: "CANCELLED" } });
      if (manuscript) {
        manuscript.status = "REJECTED";
        await manuscript.save();
      }
    } else if (decision === "NEEDS_REVISION") {
      await SeriesModel.findByIdAndUpdate(seriesId, { $set: { status: "DRAFT" } });
      if (manuscript) {
        manuscript.status = "REVISION_REQUESTED";
        await manuscript.save();
      }
    }
  }

  return {
    async registerBoardMember(
      userId: string, 
      role: BoardMemberRole, 
      status: BoardMemberStatus = "ACTIVE"
    ): Promise<BoardMember> {
      if (!userId) throw new BoardServiceError("USER_ID_REQUIRED", "User ID is required");
      if (!role) throw new BoardServiceError("ROLE_REQUIRED", "Role is required");

      if (!userRepository.findById) {
        throw new BoardServiceError("INTERNAL_ERROR", "User repository findById is not implemented", 500);
      }
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new BoardServiceError("USER_NOT_FOUND", "User not found", 404);
      }

      if (user.systemRole !== "BOARD" && user.systemRole !== "ADMIN") {
        throw new BoardServiceError("INVALID_SYSTEM_ROLE", "User must have system role BOARD or ADMIN");
      }

      const existing = await boardRepository.findBoardMemberByUserId(userId);
      if (existing) {
        throw new BoardServiceError("ALREADY_BOARD_MEMBER", "User is already a Board Member");
      }

      if (role === "BOARD_CHAIR" && status === "ACTIVE") {
        const members = await boardRepository.listBoardMembers();
        const activeChair = members.find(m => m.role === "BOARD_CHAIR" && m.status === "ACTIVE");
        if (activeChair) {
          throw new BoardServiceError("CHAIR_ALREADY_EXISTS", "An active Board Chair already exists");
        }
      }

      return boardRepository.createBoardMember(userId, role, status);
    },

    async listBoardMembers(): Promise<BoardMember[]> {
      return boardRepository.listBoardMembers();
    },

    async submitVote(
      userId: string, 
      seriesId: string, 
      vote: BoardVoteType, 
      reason?: string
    ): Promise<BoardVote> {
      if (!userId) throw new BoardServiceError("USER_ID_REQUIRED", "User ID is required");
      if (!seriesId) throw new BoardServiceError("SERIES_ID_REQUIRED", "Series ID is required");
      if (!vote) throw new BoardServiceError("VOTE_REQUIRED", "Vote type is required");

      const member = await boardRepository.findBoardMemberByUserId(userId);
      if (!member || member.status !== "ACTIVE") {
        throw new BoardServiceError("NOT_ACTIVE_MEMBER", "Only active board members can vote", 403);
      }

      const series = await SeriesModel.findById(seriesId);
      if (!series) {
        throw new BoardServiceError("SERIES_NOT_FOUND", "Series not found", 404);
      }

      return boardRepository.createOrUpdateVote(seriesId, member.id, vote, reason);
    },

    async getVotesBySeries(seriesId: string): Promise<BoardVote[]> {
      return boardRepository.findVotesBySeries(seriesId);
    },

    async getVoteSummary(seriesId: string) {
      const votes = await boardRepository.findVotesBySeries(seriesId);
      let approve = 0;
      let reject = 0;
      let needsRevision = 0;

      for (const v of votes) {
        if (v.vote === "APPROVE") approve++;
        else if (v.vote === "REJECT") reject++;
        else if (v.vote === "NEEDS_REVISION") needsRevision++;
      }

      return {
        approve,
        reject,
        needsRevision,
        totalVotes: votes.length
      };
    },

    async finalizeDecision(seriesId: string, decidedByUserId: string): Promise<BoardDecision> {
      if (!seriesId) throw new BoardServiceError("SERIES_ID_REQUIRED", "Series ID is required");
      if (!decidedByUserId) throw new BoardServiceError("DECIDED_BY_REQUIRED", "Decided by user ID is required");

      if (!userRepository.findById) {
        throw new BoardServiceError("INTERNAL_ERROR", "User repository findById is not implemented", 500);
      }
      const user = await userRepository.findById(decidedByUserId);
      if (!user) {
        throw new BoardServiceError("USER_NOT_FOUND", "User not found", 404);
      }

      // Check if user is Admin or Board Chair
      let isAllowed = user.systemRole === "ADMIN";
      if (!isAllowed) {
        const member = await boardRepository.findBoardMemberByUserId(decidedByUserId);
        if (member && member.status === "ACTIVE" && member.role === "BOARD_CHAIR") {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        throw new BoardServiceError("FORBIDDEN", "Only Board Chair or Admins can finalize decisions", 403);
      }

      const summary = await this.getVoteSummary(seriesId);
      if (summary.totalVotes === 0) {
        throw new BoardServiceError("NO_VOTES", "No votes have been cast for this series");
      }

      let decision: BoardDecisionType | null = null;
      const { approve, reject, needsRevision } = summary;

      if (approve > reject && approve > needsRevision) {
        decision = "APPROVED";
      } else if (reject > approve && reject > needsRevision) {
        decision = "REJECTED";
      } else if (needsRevision > approve && needsRevision > reject) {
        decision = "NEEDS_REVISION";
      } else {
        throw new BoardServiceError("TIE_BREAK_REQUIRED", "Votes are tied, a tie-break decision is required from the Board Chair");
      }

      const boardDecision = await boardRepository.createDecision(
        seriesId,
        decision,
        { approve, reject, needsRevision },
        decidedByUserId,
        false
      );

      await transitionStatus(seriesId, decision);
      return boardDecision;
    },

    async updateBoardMember(memberId: string, updates: { role?: BoardMemberRole; status?: BoardMemberStatus }): Promise<BoardMember> {
      const member = await boardRepository.findBoardMemberById(memberId);
      if (!member) {
        throw new BoardServiceError("MEMBER_NOT_FOUND", "Board member not found", 404);
      }

      if (updates.role === "BOARD_CHAIR" && updates.role !== member.role) {
        const members = await boardRepository.listBoardMembers();
        const activeChair = members.find(m => m.role === "BOARD_CHAIR" && m.status === "ACTIVE" && m.id !== memberId);
        if (activeChair) {
          throw new BoardServiceError("CHAIR_ALREADY_EXISTS", "An active Board Chair already exists");
        }
      }

      const updated = await boardRepository.updateBoardMember(memberId, updates);
      if (!updated) {
        throw new BoardServiceError("UPDATE_FAILED", "Failed to update board member", 500);
      }
      return updated;
    },

    async removeBoardMember(memberId: string): Promise<void> {
      const member = await boardRepository.findBoardMemberById(memberId);
      if (!member) {
        throw new BoardServiceError("MEMBER_NOT_FOUND", "Board member not found", 404);
      }

      const activeCount = await boardRepository.countActiveBoardMembers();
      if (activeCount <= 3) {
        throw new BoardServiceError("MIN_BOARD_SIZE", "Board must have at least 3 active members");
      }

      const deleted = await boardRepository.deleteBoardMember(memberId);
      if (!deleted) {
        throw new BoardServiceError("DELETE_FAILED", "Failed to remove board member", 500);
      }
    },

    async setBoardChair(memberId: string): Promise<BoardMember> {
      const member = await boardRepository.findBoardMemberById(memberId);
      if (!member) {
        throw new BoardServiceError("MEMBER_NOT_FOUND", "Board member not found", 404);
      }

      const members = await boardRepository.listBoardMembers();
      const currentChair = members.find(m => m.role === "BOARD_CHAIR" && m.status === "ACTIVE" && m.id !== memberId);

      if (currentChair) {
        await boardRepository.updateBoardMember(currentChair.id, { role: "BOARD_MEMBER" });
      }

      const updated = await boardRepository.updateBoardMember(memberId, { role: "BOARD_CHAIR", status: "ACTIVE" });
      if (!updated) {
        throw new BoardServiceError("UPDATE_FAILED", "Failed to set board chair", 500);
      }
      return updated;
    },

    async finalizeTieBreak(
      seriesId: string, 
      decidedByUserId: string, 
      decision: BoardDecisionType, 
      reason: string
    ): Promise<BoardDecision> {
      if (!seriesId) throw new BoardServiceError("SERIES_ID_REQUIRED", "Series ID is required");
      if (!decidedByUserId) throw new BoardServiceError("DECIDED_BY_REQUIRED", "Decided by user ID is required");
      if (!decision) throw new BoardServiceError("DECISION_REQUIRED", "Decision type is required");
      if (!reason || !reason.trim()) throw new BoardServiceError("REASON_REQUIRED", "Reason is required for tie-break decisions");

      const member = await boardRepository.findBoardMemberByUserId(decidedByUserId);
      if (!member || member.status !== "ACTIVE" || member.role !== "BOARD_CHAIR") {
        throw new BoardServiceError("FORBIDDEN", "Only Board Chair can finalize tie-break decisions", 403);
      }

      const summary = await this.getVoteSummary(seriesId);
      const boardDecision = await boardRepository.createDecision(
        seriesId,
        decision,
        { approve: summary.approve, reject: summary.reject, needsRevision: summary.needsRevision },
        decidedByUserId,
        true,
        reason
      );

      await transitionStatus(seriesId, decision);
      return boardDecision;
    }
  };
}
export type BoardService = ReturnType<typeof createBoardService>;
