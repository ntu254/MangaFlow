import { describe, expect, it } from "vitest";
import { BOARD_VOTE_VALUES, COMMENT_STATUSES, SERIES_STATUSES, TASK_STATUSES, isSeriesStatus, } from "./status.js";
describe("workflow status constants", () => {
    it("exposes canonical Series statuses from the workflow contract", () => {
        expect(SERIES_STATUSES).toEqual([
            "DRAFT",
            "EDITOR_REVIEW",
            "REVISION_REQUESTED",
            "BOARD_REVIEW",
            "APPROVED",
            "ONGOING",
            "AT_RISK",
            "REJECTED",
            "CANCELLED",
            "COMPLETED",
        ]);
    });
    it("exposes review and Board values needed by future workflow services", () => {
        expect(TASK_STATUSES).toContain("EDITOR_APPROVED");
        expect(COMMENT_STATUSES).toContain("RESOLVED_BY_EDITOR");
        expect(BOARD_VOTE_VALUES).toEqual(["APPROVE", "REJECT", "NEEDS_REVISION"]);
    });
    it("narrows Series status strings", () => {
        expect(isSeriesStatus("BOARD_REVIEW")).toBe(true);
        expect(isSeriesStatus("PENDING_REVIEW")).toBe(false);
    });
});
//# sourceMappingURL=status.test.js.map