import { beforeEach, describe, expect, it, vi } from "vitest"
import { SeriesMember } from "../series/series.model.js"
import * as readiness from "../chapter/chapter.service.js"
import * as repository from "./publication.repository.js"
import * as chapterReview from "../chapter-review/chapter-review.service.js"
import { createPublicationService, publishPublicationService, schedulePublicationService } from "./publication.service.js"

vi.mock("./publication.repository.js")
vi.mock("../chapter/chapter.service.js", async () => {
  const actual = await vi.importActual<typeof import("../chapter/chapter.service.js")>("../chapter/chapter.service.js")
  return { ...actual, getChapterReadinessService: vi.fn() }
})
vi.mock("../series/series.model.js", () => ({
  SeriesMember: { findOne: vi.fn() },
}))
vi.mock("../chapter-review/chapter-review.service.js", () => ({
  assertPublicationVersionCandidate: vi.fn(),
}))

describe("publication.service", () => {
  const actor = { userId: "editor1", role: "EDITOR" as const }
  const chapter = { _id: "chapter1", seriesId: "series1", status: "READY_FOR_PUBLICATION" }
  const publication = { _id: "publication1", chapterId: "chapter1", seriesId: "series1", publishedAt: null }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "EDITOR" } as any)
    vi.mocked(chapterReview.assertPublicationVersionCandidate).mockResolvedValue({ _id: "version1" } as any)
  })

  it("creates a publication and mirrors scheduled date to chapter draft schedule", async () => {
    vi.mocked(repository.getPublicationChapter).mockResolvedValue(chapter as any)
    vi.mocked(repository.createPublicationRecord).mockResolvedValue({ ...publication, scheduledFor: new Date("2026-06-10T00:00:00.000Z") } as any)

    await createPublicationService({ chapterId: "chapter1", scheduledFor: "2026-06-10T00:00:00.000Z", actor })

    expect(repository.updateChapterDraftSchedule).toHaveBeenCalledWith("chapter1", new Date("2026-06-10T00:00:00.000Z"))
    expect(repository.createPublicationRecord).toHaveBeenCalledWith(expect.objectContaining({ chapterId: "chapter1", chapterVersionId: "version1", seriesId: "series1", createdBy: "editor1" }))
  })

  it("blocks publication creation before the chapter is ready", async () => {
    vi.mocked(repository.getPublicationChapter).mockResolvedValue({ ...chapter, status: "IN_PRODUCTION" } as any)

    await expect(createPublicationService({ chapterId: "chapter1", actor })).rejects.toThrow(
      "only after the chapter is READY_FOR_PUBLICATION",
    )
    expect(repository.createPublicationRecord).not.toHaveBeenCalled()
  })

  it("blocks publication creation when the chapter has no approved locked version", async () => {
    vi.mocked(repository.getPublicationChapter).mockResolvedValue(chapter as any)
    vi.mocked(chapterReview.assertPublicationVersionCandidate).mockRejectedValue(new Error("Approved chapter version candidate is missing or unlocked."))

    await expect(createPublicationService({ chapterId: "chapter1", actor })).rejects.toThrow(
      "Approved chapter version candidate is missing or unlocked.",
    )
    expect(repository.createPublicationRecord).not.toHaveBeenCalled()
  })

  it("schedules an existing publication", async () => {
    vi.mocked(repository.getPublicationById).mockResolvedValue(publication as any)
    vi.mocked(repository.updatePublicationSchedule).mockResolvedValue({ ...publication, scheduledFor: new Date("2026-06-11T00:00:00.000Z") } as any)

    await schedulePublicationService({ publicationId: "publication1", scheduledFor: "2026-06-11T00:00:00.000Z", actor })

    expect(repository.updateChapterDraftSchedule).toHaveBeenCalledWith("chapter1", new Date("2026-06-11T00:00:00.000Z"))
    expect(repository.updatePublicationSchedule).toHaveBeenCalledWith("publication1", new Date("2026-06-11T00:00:00.000Z"), "editor1")
  })

  it("blocks publish when readiness fails", async () => {
    vi.mocked(repository.getPublicationById).mockResolvedValue(publication as any)
    vi.mocked(readiness.getChapterReadinessService).mockResolvedValue({
      chapterId: "chapter1",
      chapterStatus: "IN_PRODUCTION",
      ready: false,
      items: [{ key: "allCommentsResolved", passed: false, reason: "Blocking comments remain." }],
    } as any)

    await expect(publishPublicationService("publication1", actor)).rejects.toThrow("Chapter is not ready for publication")
    expect(repository.markPublicationPublished).not.toHaveBeenCalled()
  })

  it("publishes only after readiness passes and transitions chapter", async () => {
    vi.mocked(repository.getPublicationById).mockResolvedValue(publication as any)
    vi.mocked(readiness.getChapterReadinessService).mockResolvedValue({
      chapterId: "chapter1",
      chapterStatus: "READY_FOR_PUBLICATION",
      ready: true,
      items: [],
    } as any)
    vi.mocked(repository.markPublicationPublished).mockResolvedValue({ ...publication, publishedAt: new Date() } as any)

    await publishPublicationService("publication1", actor)

    expect(repository.updateChapterPublicationStatus).toHaveBeenCalledOnce()
    expect(repository.updateChapterPublicationStatus).toHaveBeenCalledWith("chapter1", "PUBLISHED")
    expect(repository.markPublicationPublished).toHaveBeenCalledWith("publication1", "editor1", expect.any(Date))
  })

  it("blocks non-Editor publication access", async () => {
    vi.mocked(repository.getPublicationChapter).mockResolvedValue(chapter as any)
    await expect(createPublicationService({ chapterId: "chapter1", actor: { userId: "admin1", role: "ADMIN" } })).rejects.toThrow("Publication access denied")
  })
})
