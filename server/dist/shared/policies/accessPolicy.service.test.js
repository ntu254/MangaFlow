import { beforeEach, describe, expect, it, vi } from "vitest";
const pageFindById = vi.fn();
const pageFindOne = vi.fn();
const chapterFindById = vi.fn();
const fileAssetFindById = vi.fn();
const seriesMemberFindOne = vi.fn();
const submissionFindOne = vi.fn();
const taskFindOne = vi.fn();
vi.mock("../../modules/chapter/chapter.model.js", () => ({
    Page: { findById: pageFindById, findOne: pageFindOne },
    Chapter: { findById: chapterFindById },
    FileAsset: { findById: fileAssetFindById },
}));
vi.mock("../../modules/series/series.model.js", () => ({
    SeriesMember: { findOne: seriesMemberFindOne },
}));
vi.mock("../../modules/submission/submission.model.js", () => ({
    Submission: { findOne: submissionFindOne },
}));
vi.mock("../../modules/task/task.model.js", () => ({
    Task: { findOne: taskFindOne },
}));
const { assertCanReadFileAsset, canReadPage } = await import("./accessPolicy.service.js");
describe("AccessPolicyService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        pageFindById.mockResolvedValue({ _id: "page1", chapterId: "chapter1" });
        chapterFindById.mockResolvedValue({ _id: "chapter1", seriesId: "series1" });
        fileAssetFindById.mockResolvedValue({ _id: "file1", uploadedBy: "owner1" });
        pageFindOne.mockResolvedValue(null);
        submissionFindOne.mockResolvedValue(null);
        seriesMemberFindOne.mockResolvedValue(null);
        taskFindOne.mockResolvedValue(null);
    });
    it("denies Assistant page access from SeriesMember alone", async () => {
        seriesMemberFindOne.mockResolvedValue({ role: "ASSISTANT", isActive: true, accessScope: "TASK_ONLY" });
        await expect(canReadPage({ userId: "assistant1", role: "ASSISTANT" }, "page1")).resolves.toBe(false);
        expect(taskFindOne).toHaveBeenCalledWith({
            seriesId: "series1",
            assignedTo: "assistant1",
            $or: [{ pageId: "page1" }, { contextPageIds: "page1" }],
        });
    });
    it("allows Assistant page access for assigned task or explicit context page", async () => {
        taskFindOne.mockResolvedValue({ _id: "task1", assignedTo: "assistant1" });
        await expect(canReadPage({ userId: "assistant1", role: "ASSISTANT" }, "page1")).resolves.toBe(true);
    });
    it("denies signed file access when file is outside task/page/submission scope", async () => {
        await expect(assertCanReadFileAsset({ userId: "assistant1", role: "ASSISTANT" }, "file1")).rejects.toMatchObject({
            statusCode: 403,
            message: "File access denied",
        });
    });
    it("allows signed file access for a scoped page file", async () => {
        pageFindOne.mockResolvedValue({ _id: "page1", chapterId: "chapter1" });
        taskFindOne.mockResolvedValue({ _id: "task1", assignedTo: "assistant1" });
        await expect(assertCanReadFileAsset({ userId: "assistant1", role: "ASSISTANT" }, "file1")).resolves.toBeUndefined();
    });
});
//# sourceMappingURL=accessPolicy.service.test.js.map