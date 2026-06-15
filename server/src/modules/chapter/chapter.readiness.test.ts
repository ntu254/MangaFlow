import { beforeEach, describe, expect, it, vi } from "vitest"

const getChapterReadinessData = vi.fn()

vi.mock("./chapter.repository.js", async () => {
  const actual = await vi.importActual<typeof import("./chapter.repository.js")>("./chapter.repository.js")
  return {
    ...actual,
    getChapterReadinessData,
  }
})

const { getChapterReadinessService } = await import("./chapter.service.js")

describe("chapter readiness service", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns blocked item reasons when readiness fails", async () => {
    getChapterReadinessData.mockResolvedValue({
      chapter: { _id: "chapter-1", status: "IN_REVIEW", draftSchedule: null },
      pages: [{ status: "UPLOADED" }, { status: "IN_PROGRESS" }],
      tasks: [{ status: "EDITOR_APPROVED" }, { status: "SUBMITTED" }],
      submissions: [{ status: "EDITOR_APPROVED" }, { status: "SUBMITTED" }],
      blockingComments: [{ id: "comment-1" }],
    })

    const result = await getChapterReadinessService("chapter-1")

    expect(result.ready).toBe(false)
    expect(result.items).toEqual([
      expect.objectContaining({ key: "allPagesUploaded", passed: false }),
      expect.objectContaining({ key: "allTasksApproved", passed: false }),
      expect.objectContaining({ key: "allSubmissionsApproved", passed: false }),
      expect.objectContaining({ key: "allCommentsResolved", passed: false }),
      expect.objectContaining({ key: "editorFinalApprovalExists", passed: true }),
      expect.objectContaining({ key: "publicationDateExists", passed: false }),
    ])
  })

  it("returns ready when all publication checks pass", async () => {
    getChapterReadinessData.mockResolvedValue({
      chapter: { _id: "chapter-2", status: "IN_REVIEW", draftSchedule: new Date("2026-06-10T00:00:00.000Z") },
      pages: [{ status: "UPLOADED" }, { status: "APPROVED" }],
      tasks: [{ status: "EDITOR_APPROVED" }],
      submissions: [{ status: "EDITOR_APPROVED" }],
      blockingComments: [],
    })

    const result = await getChapterReadinessService("chapter-2")

    expect(result.ready).toBe(true)
    expect(result.items.every((item: { passed: boolean }) => item.passed)).toBe(true)
  })
})
