import mongoose from "mongoose";
import { 
  BoardMemberModel, 
  BoardVoteModel, 
  BoardDecisionModel, 
  type BoardMemberDocument, 
  type BoardVoteDocument, 
  type BoardDecisionDocument,
  type BoardMemberRole,
  type BoardMemberStatus,
  type BoardVoteType,
  type BoardDecisionType
} from "./board.model.js";

export interface BoardMember {
  id: string;
  userId: string;
  role: BoardMemberRole;
  status: BoardMemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BoardVote {
  id: string;
  seriesId: string;
  boardMemberId: string;
  vote: BoardVoteType;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardDecision {
  id: string;
  seriesId: string;
  decision: BoardDecisionType;
  voteSummary: {
    approve: number;
    reject: number;
    needsRevision: number;
  };
  decidedBy: string;
  isTieBreak: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

function serializeBoardMember(doc: BoardMemberDocument & { _id: unknown }): BoardMember {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    role: doc.role,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

function serializeBoardVote(doc: BoardVoteDocument & { _id: unknown }): BoardVote {
  return {
    id: String(doc._id),
    seriesId: String(doc.seriesId),
    boardMemberId: String(doc.boardMemberId),
    vote: doc.vote,
    reason: doc.reason,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

function serializeBoardDecision(doc: BoardDecisionDocument & { _id: unknown }): BoardDecision {
  return {
    id: String(doc._id),
    seriesId: String(doc.seriesId),
    decision: doc.decision,
    voteSummary: {
      approve: doc.voteSummary.approve,
      reject: doc.voteSummary.reject,
      needsRevision: doc.voteSummary.needsRevision
    },
    decidedBy: String(doc.decidedBy),
    isTieBreak: doc.isTieBreak,
    reason: doc.reason,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

export function createMongoBoardRepository() {
  return {
    async createBoardMember(userId: string, role: BoardMemberRole, status: BoardMemberStatus = "ACTIVE"): Promise<BoardMember> {
      const doc = await BoardMemberModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        role,
        status
      });
      return serializeBoardMember(doc);
    },

    async findBoardMemberById(id: string): Promise<BoardMember | null> {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await BoardMemberModel.findById(id);
      return doc ? serializeBoardMember(doc) : null;
    },

    async findBoardMemberByUserId(userId: string): Promise<BoardMember | null> {
      if (!mongoose.isValidObjectId(userId)) return null;
      const doc = await BoardMemberModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      return doc ? serializeBoardMember(doc) : null;
    },

    async listBoardMembers(): Promise<BoardMember[]> {
      const docs = await BoardMemberModel.find().sort({ createdAt: 1 });
      return docs.map(serializeBoardMember);
    },

    async createOrUpdateVote(
      seriesId: string, 
      boardMemberId: string, 
      vote: BoardVoteType, 
      reason?: string
    ): Promise<BoardVote> {
      const doc = await BoardVoteModel.findOneAndUpdate(
        { 
          seriesId: new mongoose.Types.ObjectId(seriesId), 
          boardMemberId: new mongoose.Types.ObjectId(boardMemberId) 
        },
        { 
          $set: { 
            vote, 
            reason 
          } 
        },
        { upsert: true, returnDocument: "after" }
      );
      return serializeBoardVote(doc);
    },

    async findVotesBySeries(seriesId: string): Promise<BoardVote[]> {
      if (!mongoose.isValidObjectId(seriesId)) return [];
      const docs = await BoardVoteModel.find({ seriesId: new mongoose.Types.ObjectId(seriesId) });
      return docs.map(serializeBoardVote);
    },

    async createDecision(
      seriesId: string,
      decision: BoardDecisionType,
      voteSummary: { approve: number; reject: number; needsRevision: number },
      decidedBy: string,
      isTieBreak: boolean,
      reason?: string
    ): Promise<BoardDecision> {
      const doc = await BoardDecisionModel.create({
        seriesId: new mongoose.Types.ObjectId(seriesId),
        decision,
        voteSummary,
        decidedBy: new mongoose.Types.ObjectId(decidedBy),
        isTieBreak,
        reason
      });
      return serializeBoardDecision(doc);
    },

    async findDecisionBySeries(seriesId: string): Promise<BoardDecision | null> {
      if (!mongoose.isValidObjectId(seriesId)) return null;
      const doc = await BoardDecisionModel.findOne({ seriesId: new mongoose.Types.ObjectId(seriesId) }).sort({ createdAt: -1 });
      return doc ? serializeBoardDecision(doc) : null;
    }
  };
}

export type BoardRepository = ReturnType<typeof createMongoBoardRepository>;
