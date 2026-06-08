import { beforeEach, describe, expect, it, vi } from "vitest"
import { SeriesMember } from "../series/series.model.js"
import * as repository from "./comment.repository.js"
import {
  createCommentService,
  hasBlockingUnresolvedCommentsService,
  markCommentFixedService,
  reopenCommentService,
  resolveCommentService,
  verifyCommentFixedService,
} from "./comment.service.js"

vi.mock("./comment.repository.js")
vi.mock("../series/series.model.js", () => ({
  SeriesMember: {
    findOne: vi.fn(),
  },
}))

describe("comment resolution service", () => {
  const openComment = {
    _id: "comment1",
    seriesId: "series1",
    taskId: "task1",
    status: "OPEN",
    isBlocking: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lets an Editor create an OPEN blocking comment", async () => {
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "EDITOR" } as any)
    vi.mocked(repository.createCommentRecord).mockResolvedValue({
      id: "comment1",
      status: "OPEN",
      isBlocking: true,
    } as any)

    const result = await createCommentService({
      actor: { userId: "editor1", role: "EDITOR" },
      seriesId: "series1",
      body: "Please clean this bubble",
    })

    expect(result).toMatchObject({ status: "OPEN", isBlocking: true })
    expect(repository.createCommentRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: "editor1",
        body: "Please clean this bubble",
        isBlocking: undefined,
      }),
    )
  })

  it("blocks non-Editors from creating comments", async () => {
    await expect(
      createCommentService({
        actor: { userId: "mangaka1", role: "MANGAKA" },
        seriesId: "series1",
        body: "Nope",
      }),
    ).rejects.toThrow("Comment access denied")
  })

  it("lets the assigned Assistant mark an open comment fixed", async () => {
    vi.mocked(repository.getCommentById).mockResolvedValue(openComment as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)
    vi.mocked(repository.getTaskForComment).mockResolvedValue({
      _id: "task1",
      assignedTo: "assistant1",
    } as any)
    vi.mocked(repository.updateCommentStatus).mockResolvedValue({
      id: "comment1",
      status: "FIXED_BY_ASSISTANT",
    } as any)

    const result = await markCommentFixedService("comment1", {
      userId: "assistant1",
      role: "ASSISTANT",
    })

    expect(result).toMatchObject({ status: "FIXED_BY_ASSISTANT" })
    expect(repository.updateCommentStatus).toHaveBeenCalledWith(
      "comment1",
      "FIXED_BY_ASSISTANT",
      "fixedBy",
      "assistant1",
    )
  })

  it("blocks Assistant from marking another Assistant's task comment fixed", async () => {
    vi.mocked(repository.getCommentById).mockResolvedValue(openComment as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)
    vi.mocked(repository.getTaskForComment).mockResolvedValue({
      _id: "task1",
      assignedTo: "assistant2",
    } as any)

    await expect(
      markCommentFixedService("comment1", {
        userId: "assistant1",
        role: "ASSISTANT",
      }),
    ).rejects.toThrow("Assistant can mark fixed only for their assigned task")
  })

  it("requires Mangaka verification before Editor resolution", async () => {
    vi.mocked(repository.getCommentById).mockResolvedValue({
      ...openComment,
      status: "FIXED_BY_ASSISTANT",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "EDITOR" } as any)

    await expect(
      resolveCommentService("comment1", {
        userId: "editor1",
        role: "EDITOR",
      }),
    ).rejects.toThrow("Editor resolution requires Mangaka verification first")
  })

  it("lets Mangaka verify fixed comments and Editor resolve verified comments", async () => {
    vi.mocked(repository.getCommentById)
      .mockResolvedValueOnce({ ...openComment, status: "FIXED_BY_ASSISTANT" } as any)
      .mockResolvedValueOnce({ ...openComment, status: "VERIFIED_BY_MANGAKA" } as any)
    vi.mocked(SeriesMember.findOne)
      .mockResolvedValueOnce({ isActive: true, role: "MANGAKA" } as any)
      .mockResolvedValueOnce({ isActive: true, role: "EDITOR" } as any)
    vi.mocked(repository.updateCommentStatus)
      .mockResolvedValueOnce({ id: "comment1", status: "VERIFIED_BY_MANGAKA" } as any)
      .mockResolvedValueOnce({ id: "comment1", status: "RESOLVED_BY_EDITOR" } as any)

    await verifyCommentFixedService("comment1", {
      userId: "mangaka1",
      role: "MANGAKA",
    })
    const resolved = await resolveCommentService("comment1", {
      userId: "editor1",
      role: "EDITOR",
    })

    expect(resolved).toMatchObject({ status: "RESOLVED_BY_EDITOR" })
  })

  it("lets Editor reopen fixed or verified comments", async () => {
    vi.mocked(repository.getCommentById).mockResolvedValue({
      ...openComment,
      status: "VERIFIED_BY_MANGAKA",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "EDITOR" } as any)
    vi.mocked(repository.updateCommentStatus).mockResolvedValue({
      id: "comment1",
      status: "OPEN",
    } as any)

    const result = await reopenCommentService("comment1", {
      userId: "editor1",
      role: "EDITOR",
    })

    expect(result).toMatchObject({ status: "OPEN" })
    expect(repository.updateCommentStatus).toHaveBeenCalledWith(
      "comment1",
      "OPEN",
      "reopenedBy",
      "editor1",
    )
  })

  it("reports blocking unresolved comments for future readiness checks", async () => {
    vi.mocked(repository.countBlockingUnresolvedComments).mockResolvedValue(1)

    await expect(
      hasBlockingUnresolvedCommentsService({ chapterId: "chapter1" }),
    ).resolves.toBe(true)
  })
})
