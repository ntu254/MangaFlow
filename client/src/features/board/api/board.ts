import { apiBaseUrl, parseApiResponse, fetchCurrentUser } from "@/shared/api";
import type { CurrentUser } from "@/shared/api";

export type { CurrentUser };

export { fetchCurrentUser };

export type BoardMemberRole = "BOARD_MEMBER" | "BOARD_CHAIR";
export type BoardMemberStatus = "ACTIVE" | "INACTIVE";
export type BoardVoteType = "APPROVE" | "REJECT" | "NEEDS_REVISION";
export type BoardDecisionType = "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "CONTINUE" | "CANCEL";

export type BoardMember = {
  id: string;
  userId: string;
  role: BoardMemberRole;
  status: BoardMemberStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    fullName: string;
    email: string;
  };
};

export type BoardVote = {
  id: string;
  seriesId: string;
  boardMemberId: string;
  vote: BoardVoteType;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

export type BoardDecision = {
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
};

export type VoteSummary = {
  approve: number;
  reject: number;
  needsRevision: number;
  totalVotes: number;
};

export async function fetchBoardMembers(token: string): Promise<BoardMember[]> {
  const response = await fetch(`${apiBaseUrl}/board/members`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<BoardMember[]>(response, "Failed to fetch board members");
}

export async function submitBoardVote(
  token: string,
  seriesId: string,
  vote: BoardVoteType,
  reason?: string
): Promise<BoardVote> {
  const response = await fetch(`${apiBaseUrl}/series/${seriesId}/votes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ vote, reason })
  });
  return parseApiResponse<BoardVote>(response, "Failed to submit board vote");
}

export async function fetchBoardVotesForSeries(token: string, seriesId: string): Promise<BoardVote[]> {
  const response = await fetch(`${apiBaseUrl}/series/${seriesId}/votes`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<BoardVote[]>(response, "Failed to fetch board votes");
}

export async function fetchBoardVoteSummary(token: string, seriesId: string): Promise<VoteSummary> {
  const response = await fetch(`${apiBaseUrl}/series/${seriesId}/votes/summary`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<VoteSummary>(response, "Failed to fetch board vote summary");
}

export async function addBoardMember(
  token: string,
  userId: string,
  role: BoardMemberRole = "BOARD_MEMBER"
): Promise<BoardMember> {
  const response = await fetch(`${apiBaseUrl}/board/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId, role })
  });
  return parseApiResponse<BoardMember>(response, "Failed to add board member");
}

export async function updateBoardMember(
  token: string,
  boardMemberId: string,
  updates: { role?: BoardMemberRole; status?: BoardMemberStatus }
): Promise<BoardMember> {
  const response = await fetch(`${apiBaseUrl}/board/members/${boardMemberId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  return parseApiResponse<BoardMember>(response, "Failed to update board member");
}

export async function removeBoardMember(token: string, boardMemberId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/board/members/${boardMemberId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message || "Failed to remove board member");
  }
}

export async function setBoardChair(token: string, boardMemberId: string): Promise<BoardMember> {
  const response = await fetch(`${apiBaseUrl}/board/members/${boardMemberId}/set-chair`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseApiResponse<BoardMember>(response, "Failed to set board chair");
}

export async function finalizeBoardDecision(token: string, seriesId: string): Promise<BoardDecision> {
  const response = await fetch(`${apiBaseUrl}/series/${seriesId}/decisions/finalize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<BoardDecision>(response, "Failed to finalize board decision");
}

export async function tieBreakBoardDecision(
  token: string,
  seriesId: string,
  decision: BoardDecisionType,
  reason: string
): Promise<BoardDecision> {
  const response = await fetch(`${apiBaseUrl}/series/${seriesId}/decisions/tie-break`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ decision, reason })
  });
  return parseApiResponse<BoardDecision>(response, "Failed to submit tie-break decision");
}
