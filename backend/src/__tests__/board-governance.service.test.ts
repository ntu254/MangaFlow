import { describe, expect, it } from "vitest";
import {
  BOARD_QUORUM,
  BOARD_TOTAL,
  DEFAULT_BOARD_ELIGIBLE_VOTER_IDS,
  EIC_TIEBREAK_WEIGHT,
  evaluateBoardTally,
  normalizeBoardVote,
} from "../services/board-governance.service.js";

describe("Board governance bounded context", () => {
  it("keeps the canonical roster, quorum, and tie-break weight", () => {
    expect(BOARD_TOTAL).toBe(5);
    expect(BOARD_QUORUM).toBe(3);
    expect(DEFAULT_BOARD_ELIGIBLE_VOTER_IDS).toHaveLength(5);
    expect(EIC_TIEBREAK_WEIGHT).toBe(2);
  });

  it("evaluates approval, rejection, tie-break, and pending tallies", () => {
    expect(
      evaluateBoardTally([
        { decision: "APPROVE" },
        { decision: "APPROVE" },
        { decision: "APPROVE" },
      ]).status,
    ).toBe("APPROVED");
    expect(
      evaluateBoardTally([{ decision: "REJECT" }, { decision: "REJECT" }, { decision: "REJECT" }])
        .status,
    ).toBe("REJECTED");
    expect(
      evaluateBoardTally(
        [{ decision: "APPROVE" }, { decision: "REJECT" }, { decision: "ABSTAIN" }],
        BOARD_QUORUM,
        3,
      ).status,
    ).toBe("TIE_BREAK");
    expect(evaluateBoardTally([{ decision: "APPROVE" }]).status).toBeNull();
  });

  it("normalizes legacy voter field aliases without changing the decision", () => {
    expect(
      normalizeBoardVote({ voterId: "u-board-2", voterName: "Sato", decision: "APPROVE" }),
    ).toMatchObject({
      memberId: "u-board-2",
      memberName: "Sato",
      decision: "APPROVE",
      weight: 1,
      isChair: false,
      isEditorInChief: false,
    });
  });
});
