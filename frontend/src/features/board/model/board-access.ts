export { decisionEffect } from "@/entities/proposal/model/decision-effect";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { evaluateBoardTally } from "@/entities/proposal/model/board-tally";
import type { RankingRow, RiskLevel } from "@/entities/board/model/board-types";

export function summarizeVotes(proposal: SeriesProposal) {
  const tally = evaluateBoardTally(proposal.votes);
  return {
    ...tally,
    pending: Math.max(BOARD_TOTAL - tally.total, 0),
    progress: tally.total / BOARD_TOTAL,
    alreadyFinal: proposal.status === "APPROVED" || proposal.status === "REJECTED",
  };
}

export function buildBoardQueue(proposals: SeriesProposal[]) {
  return proposals
    .filter((proposal) =>
      ["PENDING_BOARD", "TIE_BREAK", "APPROVED", "REJECTED"].includes(proposal.status),
    )
    .map((proposal) => {
      const votes = summarizeVotes(proposal);
      const needsFinalize =
        proposal.status === "PENDING_BOARD" && votes.total >= BOARD_TOTAL && !votes.status;
      return {
        proposal,
        votes,
        needsFinalize,
        tab:
          proposal.status === "TIE_BREAK"
            ? "Tie-break"
            : proposal.status === "APPROVED"
              ? "Approved"
              : proposal.status === "REJECTED"
                ? "Rejected"
                : needsFinalize
                  ? "Needs Finalize"
                  : "Pending Vote",
      };
    });
}

export function riskFromRanking(row: RankingRow): RiskLevel {
  if (row.score < 4.5 || row.completionRate < 0.3) return "CRITICAL";
  if (row.score < 5.5 || row.completionRate < 0.4) return "HIGH";
  if (row.score < 7 || row.trend === "DOWN") return "MEDIUM";
  return "LOW";
}
