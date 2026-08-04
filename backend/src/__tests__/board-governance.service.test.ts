import { describe, expect, it } from "vitest";
import {
  BOARD_QUORUM,
  BOARD_TOTAL,
  evaluateBoardTally,
  normalizeBoardVote,
} from "../services/board-governance.service.js";

describe("Board governance bounded context", () => {
  it("keeps the canonical roster and quorum", () => {
    expect(BOARD_TOTAL).toBe(5);
    expect(BOARD_QUORUM).toBe(3);
  });

  it("evaluates majority, quorum, tie, and pending tallies", () => {
    expect(
      evaluateBoardTally(
        [{ decision: "APPROVE" }, { decision: "APPROVE" }, { decision: "REJECT" }],
        BOARD_QUORUM,
        BOARD_TOTAL,
      ).status,
    ).toBe("APPROVED");
    expect(
      evaluateBoardTally(
        [{ decision: "REJECT" }, { decision: "REJECT" }, { decision: "APPROVE" }],
        BOARD_QUORUM,
        BOARD_TOTAL,
      ).status,
    ).toBe("REJECTED");
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
        [{ decision: "APPROVE" }, { decision: "REJECT" }],
        BOARD_QUORUM,
        BOARD_TOTAL,
      ).status,
    ).toBeNull();
    expect(
      evaluateBoardTally(
        [{ decision: "APPROVE" }, { decision: "REJECT" }, { decision: "APPROVE" }, { decision: "REJECT" }],
        BOARD_QUORUM,
        4,
    ).status,
    ).toBeNull();
    expect(
      evaluateBoardTally(
        [{ decision: "APPROVE" }, { decision: "REJECT" }, { decision: "APPROVE" }, { decision: "REJECT" }],
        BOARD_QUORUM,
        BOARD_TOTAL,
      ).reason,
    ).toContain("Waiting for more votes");
    expect(evaluateBoardTally([{ decision: "APPROVE" }]).status).toBeNull();
  });

  it("normalizes canonical voter fields", () => {
    expect(
      normalizeBoardVote({ voterId: "u-board-2", voterName: "Sato", decision: "APPROVE" }),
    ).toMatchObject({
      voterId: "u-board-2",
      voterName: "Sato",
      decision: "APPROVE",
      weight: 1,
    });
  });
});
