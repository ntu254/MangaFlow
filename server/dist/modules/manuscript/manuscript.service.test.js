import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repository from "./manuscript.repository.js";
import { forwardManuscriptToBoardService, rejectManuscriptService, requestManuscriptRevisionService, } from "./manuscript.service.js";
vi.mock("./manuscript.repository.js");
vi.mock("../board/board.repository.js", () => ({
    createBoardReviewSession: vi.fn().mockResolvedValue({ id: "session1" }),
    getOrCreateDecision: vi.fn().mockResolvedValue({ status: "PENDING" }),
}));
vi.mock("../../shared/workflow/events.js", () => ({
    notifyRole: vi.fn().mockResolvedValue([]),
    notifyUsers: vi.fn().mockResolvedValue([]),
    recordAuditLog: vi.fn().mockResolvedValue(null),
}));
describe("manuscript review service", () => {
    const manuscript = {
        _id: "manuscript1",
        seriesId: "series1",
        status: "SUBMITTED",
    };
    const series = {
        _id: "series1",
        status: "EDITOR_REVIEW",
    };
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(repository.getManuscriptById).mockResolvedValue(manuscript);
        vi.mocked(repository.getSeriesForManuscript).mockResolvedValue(series);
    });
    it("requests revision and returns Series to REVISION_REQUESTED", async () => {
        vi.mocked(repository.updateManuscriptReviewStatus).mockResolvedValue({
            id: "manuscript1",
            status: "REVISION_REQUESTED",
        });
        const result = await requestManuscriptRevisionService({
            manuscriptId: "manuscript1",
            actor: { userId: "editor1", role: "EDITOR" },
            reviewNote: "Please revise",
        });
        expect(result).toMatchObject({ status: "REVISION_REQUESTED" });
        expect(repository.updateManuscriptReviewStatus).toHaveBeenCalledWith("manuscript1", "REVISION_REQUESTED", "Please revise", {
            editorRecommendation: undefined,
            feasibilityNote: undefined,
            riskNote: undefined,
            suggestedPublicationType: undefined,
        });
        expect(repository.updateSeriesReviewStatus).toHaveBeenCalledWith("series1", "REVISION_REQUESTED");
    });
    it("forwards manuscript to Board and sets Series BOARD_REVIEW", async () => {
        vi.mocked(repository.updateManuscriptReviewStatus).mockResolvedValue({
            id: "manuscript1",
            status: "FORWARDED_TO_BOARD",
        });
        await forwardManuscriptToBoardService({
            manuscriptId: "manuscript1",
            actor: { userId: "editor1", role: "EDITOR" },
            editorRecommendation: "Strong proposal",
            feasibilityNote: "Feasible for weekly serialization",
            suggestedPublicationType: "WEEKLY",
        });
        expect(repository.updateManuscriptReviewStatus).toHaveBeenCalledWith("manuscript1", "FORWARDED_TO_BOARD", undefined, {
            editorRecommendation: "Strong proposal",
            feasibilityNote: "Feasible for weekly serialization",
            riskNote: undefined,
            suggestedPublicationType: "WEEKLY",
        });
        expect(repository.updateSeriesReviewStatus).toHaveBeenCalledWith("series1", "BOARD_REVIEW");
    });
    it("rejects manuscript and sets Series REJECTED", async () => {
        vi.mocked(repository.updateManuscriptReviewStatus).mockResolvedValue({
            id: "manuscript1",
            status: "REJECTED",
        });
        await rejectManuscriptService({
            manuscriptId: "manuscript1",
            actor: { userId: "editor1", role: "EDITOR" },
            rejectReason: "Not aligned with magazine direction",
        });
        expect(repository.updateSeriesReviewStatus).toHaveBeenCalledWith("series1", "REJECTED");
    });
    it("blocks non-Editor review actions", async () => {
        await expect(forwardManuscriptToBoardService({
            manuscriptId: "manuscript1",
            actor: { userId: "mangaka1", role: "MANGAKA" },
        })).rejects.toThrow("Only Editor can review manuscripts");
    });
    it("blocks review when Series is not in EDITOR_REVIEW", async () => {
        vi.mocked(repository.getSeriesForManuscript).mockResolvedValue({
            ...series,
            status: "DRAFT",
        });
        await expect(forwardManuscriptToBoardService({
            manuscriptId: "manuscript1",
            actor: { userId: "editor1", role: "EDITOR" },
            editorRecommendation: "Strong proposal",
            feasibilityNote: "Feasible",
            suggestedPublicationType: "WEEKLY",
        })).rejects.toThrow("Series must be in EDITOR_REVIEW");
    });
    it("blocks review when Manuscript is not in EDITOR_REVIEW", async () => {
        vi.mocked(repository.getManuscriptById).mockResolvedValue({
            ...manuscript,
            status: "REVISION_REQUESTED",
        });
        await expect(forwardManuscriptToBoardService({
            manuscriptId: "manuscript1",
            actor: { userId: "editor1", role: "EDITOR" },
            editorRecommendation: "Strong proposal",
            feasibilityNote: "Feasible",
            suggestedPublicationType: "WEEKLY",
        })).rejects.toThrow("Manuscript must be SUBMITTED or UNDER_EDITOR_REVIEW");
    });
});
//# sourceMappingURL=manuscript.service.test.js.map