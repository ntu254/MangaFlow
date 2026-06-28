import { beforeEach, describe, expect, it, vi } from "vitest"
import { SeriesMember } from "../series/series.model.js"
import * as taskService from "../task/task.service.js"
import * as repository from "./comment.repository.js"
import {
  createCommentService,
  hasBlockingUnresolvedCommentsService,
  listCommentsByTaskService,
  markCommentFixedService,
  reopenCommentService,
  resolveCommentService,
  verifyCommentFixedService,
} from "./comment.service.js"

vi.mock("./comment.repository.js")
vi.mock("../task/task.service.js")
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
    vi.resetAllMocks()
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

  it("lets the assigned Assistant mark an open comment as fixed", async () => {
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
      status: "FIXED",
    } as any)

    const result = await markCommentFixedService("comment1", {
      userId: "assistant1",
      role: "ASSISTANT",
    })

    expect(result).toMatchObject({ status: "FIXED" })
    expect(repository.updateCommentStatus).toHaveBeenCalledWith(
      "comment1",
      "FIXED",
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

  it("blocks Editor resolution for an invalid feedback state", async () => {
    vi.mocked(repository.getCommentById).mockResolvedValue({
      ...openComment,
      status: "DELETED",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "EDITOR" } as any)

    await expect(
      resolveCommentService("comment1", {
        userId: "editor1",
        role: "EDITOR",
      }),
    ).rejects.toThrow("Editor can resolve only an active or fixed comment")
  })

  it("walks through the full comment lifecycle: fixed -> verified -> resolved", async () => {
    // Step 1: Mangaka verifies a FIXED comment -> RESOLVED
    vi.mocked(repository.getCommentById)
      .mockResolvedValueOnce({ ...openComment, status: "FIXED" } as any)
      .mockResolvedValueOnce({ ...openComment, status: "RESOLVED" } as any)
    vi.mocked(SeriesMember.findOne)
      .mockResolvedValueOnce({ isActive: true, role: "MANGAKA" } as any)
      .mockResolvedValueOnce({ isActive: true, role: "EDITOR" } as any)
    vi.mocked(repository.updateCommentStatus)
      .mockResolvedValueOnce({ id: "comment1", status: "RESOLVED" } as any)
      .mockResolvedValueOnce({ id: "comment1", status: "RESOLVED" } as any)

    // Step 2: Mangaka verifies the fixed comment -> RESOLVED
    await verifyCommentFixedService("comment1", {
      userId: "mangaka1",
      role: "MANGAKA",
    })
    // Step 3: Editor can also resolve
    const resolved = await resolveCommentService("comment1", {
      userId: "editor1",
      role: "EDITOR",
    })

    expect(resolved).toMatchObject({ status: "RESOLVED" })
  })

  it("lets Editor reopen resolved comments", async () => {
    vi.mocked(repository.getCommentById).mockResolvedValue({
      ...openComment,
      status: "RESOLVED",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({ isActive: true, role: "EDITOR" } as any)
    vi.mocked(repository.updateCommentStatus).mockResolvedValue({
      id: "comment1",
      status: "REOPENED",
    } as any)

    const result = await reopenCommentService("comment1", {
      userId: "editor1",
      role: "EDITOR",
    })

    expect(result).toMatchObject({ status: "REOPENED" })
    expect(repository.updateCommentStatus).toHaveBeenCalledWith(
      "comment1",
      "REOPENED",
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

  it("checks task access before listing task comments", async () => {
    vi.mocked(taskService.getTaskService).mockResolvedValue({ id: "task1" } as any)
    vi.mocked(repository.listCommentsByTask).mockResolvedValue([{ id: "comment1" }] as any)

    const result = await listCommentsByTaskService("task1", {
      userId: "assistant1",
      role: "ASSISTANT",
    })

    expect(taskService.getTaskService).toHaveBeenCalledWith("task1", {
      userId: "assistant1",
      role: "ASSISTANT",
    })
    expect(result).toEqual([{ id: "comment1" }])
  })
})
