import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  chapterFindById: vi.fn(),
  chapterFindByIdAndUpdate: vi.fn(),
  pageFind: vi.fn(),
  taskFind: vi.fn(),
  seriesMemberFindOne: vi.fn(),
  seriesMemberFind: vi.fn(),
  chapterVersionFindOne: vi.fn(),
  chapterVersionFind: vi.fn(),
  chapterVersionFindById: vi.fn(),
  chapterVersionCreate: vi.fn(),
  annotationCountDocuments: vi.fn(),
  annotationCreate: vi.fn(),
}))

vi.mock("../chapter/chapter.model.js", () => ({
  Chapter: {
    findById: mocks.chapterFindById,
    findByIdAndUpdate: mocks.chapterFindByIdAndUpdate,
  },
  Page: {
    find: mocks.pageFind,
  },
}))

vi.mock("../task/task.model.js", () => ({
  Task: {
    find: mocks.taskFind,
  },
}))

vi.mock("../series/series.model.js", () => ({
  SeriesMember: {
    findOne: mocks.seriesMemberFindOne,
    find: mocks.seriesMemberFind,
  },
}))

vi.mock("./chapter-review.model.js", () => ({
  ChapterVersion: {
    findOne: mocks.chapterVersionFindOne,
    find: mocks.chapterVersionFind,
    findById: mocks.chapterVersionFindById,
    create: mocks.chapterVersionCreate,
  },
  ChapterReviewAnnotation: {
    countDocuments: mocks.annotationCountDocuments,
    create: mocks.annotationCreate,
  },
}))

const {
  submitChapterVersionService,
  approveChapterVersionService,
  listEditorChapterReviewQueueService,
  requestChapterVersionRevisionService,
  createChapterReviewAnnotationService,
} = await import(
  "./chapter-review.service.js"
)

describe("chapter review service", () => {
  const mangaka = { userId: "mangaka1", role: "MANGAKA" as const }
  const editor = { userId: "editor1", role: "EDITOR" as const }
  const chapter = { _id: "chapter1", seriesId: "series1", status: "IN_PRODUCTION" }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.chapterFindById.mockResolvedValue(chapter)
    mocks.seriesMemberFindOne.mockResolvedValue({ role: "MANGAKA", status: "ACTIVE", isActive: true })
    mocks.pageFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        {
          _id: "page1",
          pageNumber: 1,
          status: "UPLOADED",
          workingFileAssetId: "asset-working-1",
          originalFileAssetId: "asset-original-1",
          thumbnailFileAssetId: "asset-thumb-1",
        },
      ]),
    })
    mocks.taskFind.mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ _id: "task1", status: "EDITOR_APPROVED" }]),
    })
  })

  it("creates v1 with immutable page snapshots", async () => {
    mocks.chapterVersionFindOne
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }) })
    mocks.chapterVersionCreate.mockResolvedValue({ _id: "version1", version: 1 })

    await submitChapterVersionService("chapter1", mangaka)

    expect(mocks.chapterVersionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        chapterId: "chapter1",
        version: 1,
        status: "SUBMITTED",
        submittedBy: "mangaka1",
        pageSnapshots: [
          expect.objectContaining({
            pageId: "page1",
            pageNumber: 1,
            fileAssetId: "asset-working-1",
          }),
        ],
      }),
    )
  })

  it("does not create a new version while another version is submitted", async () => {
    mocks.chapterVersionFindOne
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ _id: "active-version", version: 1 }) })
      .mockReturnValueOnce({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ version: 1 }) }) })

    await expect(submitChapterVersionService("chapter1", mangaka)).rejects.toThrow(
      "already has a submitted version",
    )
    expect(mocks.chapterVersionCreate).not.toHaveBeenCalled()
  })

  it("approves, locks, and marks the version as publishing candidate", async () => {
    mocks.seriesMemberFindOne.mockResolvedValue({ role: "EDITOR", status: "ACTIVE", isActive: true })
    const save = vi.fn()
    const version = {
      _id: "version1",
      seriesId: "series1",
      chapterId: "chapter1",
      status: "SUBMITTED",
      isLocked: false,
      save,
    }
    mocks.chapterVersionFindById.mockResolvedValue(version)
    mocks.annotationCountDocuments.mockResolvedValue(0)

    await approveChapterVersionService({ versionId: "version1", actor: editor, reviewerNote: "Ready" })

    expect(version.status).toBe("APPROVED")
    expect(version.isLocked).toBe(true)
    expect(save).toHaveBeenCalledOnce()
    expect(mocks.chapterFindByIdAndUpdate).toHaveBeenCalledWith("chapter1", {
      publishingCandidateVersionId: "version1",
      status: "READY_FOR_PUBLICATION",
    })
  })

  it("requires an overall review before approving", async () => {
    await expect(
      approveChapterVersionService({ versionId: "version1", actor: editor, reviewerNote: "   " }),
    ).rejects.toThrow("Overall review is required")
    expect(mocks.chapterVersionFindById).not.toHaveBeenCalled()
  })

  it("requires an overall review before requesting revision", async () => {
    await expect(
      requestChapterVersionRevisionService({ versionId: "version1", actor: editor, reviewerNote: "" }),
    ).rejects.toThrow("Overall review is required")
    expect(mocks.chapterVersionFindById).not.toHaveBeenCalled()
  })

  it("rejects annotations for pages outside the version snapshot package", async () => {
    mocks.seriesMemberFindOne.mockResolvedValue({ role: "EDITOR", status: "ACTIVE", isActive: true })
    mocks.chapterVersionFindById.mockResolvedValue({
      _id: "version1",
      seriesId: "series1",
      chapterId: "chapter1",
      isLocked: false,
      pageSnapshots: [{ pageId: "page1", pageNumber: 1, fileAssetId: "asset1" }],
    })

    await expect(
      createChapterReviewAnnotationService({
        versionId: "version1",
        actor: editor,
        pageId: "page-not-in-version",
        body: "Fix this panel",
      }),
    ).rejects.toThrow("Annotation page does not belong to this chapter version")
    expect(mocks.annotationCreate).not.toHaveBeenCalled()
  })

  it("lists submitted versions for series that do not have an assigned Editor", async () => {
    const queueItems = [{ _id: "version1", seriesId: "series1", chapterId: "chapter1", status: "SUBMITTED" }]
    mocks.seriesMemberFind
      .mockReturnValueOnce({ select: vi.fn().mockResolvedValue([]) })
      .mockReturnValueOnce({ select: vi.fn().mockResolvedValue([]) })
    mocks.chapterVersionFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(queueItems),
      }),
    })

    const result = await listEditorChapterReviewQueueService(editor)

    expect(mocks.chapterVersionFind).toHaveBeenCalledWith({
      status: "SUBMITTED",
      $or: [{ seriesId: { $in: [] } }, { seriesId: { $nin: [] } }],
    })
    expect(result).toEqual(queueItems)
  })

  it("allows a global Editor to approve when the series has no assigned Editor", async () => {
    mocks.seriesMemberFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    const save = vi.fn()
    const version = {
      _id: "version1",
      seriesId: "series1",
      chapterId: "chapter1",
      status: "SUBMITTED",
      isLocked: false,
      save,
    }
    mocks.chapterVersionFindById.mockResolvedValue(version)
    mocks.annotationCountDocuments.mockResolvedValue(0)

    await approveChapterVersionService({ versionId: "version1", actor: editor, reviewerNote: "Ready" })

    expect(version.status).toBe("APPROVED")
    expect(version.isLocked).toBe(true)
    expect(mocks.chapterFindByIdAndUpdate).toHaveBeenCalledWith("chapter1", {
      publishingCandidateVersionId: "version1",
      status: "READY_FOR_PUBLICATION",
    })
  })
})
