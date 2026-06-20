import { describe, it, expect, vi, beforeEach } from "vitest"
import { listPagesService } from "./page.service.js"
import { Page } from "../chapter.model.js"
import { Task } from "../../task/task.model.js"

vi.mock("../chapter.model.js", () => ({
  Page: {
    find: vi.fn(),
  },
  Chapter: {
    findById: vi.fn(),
  },
}))

vi.mock("../../../shared/policies/accessPolicy.service.js", () => ({
  assertCanReadChapter: vi.fn(),
}))

vi.mock("../../task/task.model.js", () => ({
  Task: {
    find: vi.fn(),
  },
}))

describe("listPagesService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns activeTask if page has an active task", async () => {
    const mockPages = [
      { _id: "page1" },
      { _id: "page2" },
      { _id: "page3" },
      { _id: "page4" },
      { _id: "page5" },
    ]

    const pageFindQuery = {
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockPages) }),
    }
    vi.mocked(Page.find).mockReturnValue(pageFindQuery as any)

    const mockTasks = [
      { _id: "task1", pageId: "page1", status: "TODO", assignedTo: { _id: "a1", name: "A 1" }, taskTypeId: { _id: "t1", name: "T1" } },
      { _id: "task2", pageId: "page2", status: "IN_PROGRESS", assignedTo: { _id: "a2", name: "A 2" }, taskTypeId: { _id: "t2", name: "T2" } },
      { _id: "task3", pageId: "page3", status: "SUBMITTED", assignedTo: { _id: "a3", name: "A 3" }, taskTypeId: { _id: "t3", name: "T3" }, currentSubmissionId: "sub1" },
      { _id: "task4", pageId: "page4", status: "REVISION_REQUESTED", assignedTo: { _id: "a4", name: "A 4" }, taskTypeId: { _id: "t4", name: "T4" } },
      { _id: "task5", pageId: "page5", status: "MANGAKA_APPROVED", assignedTo: { _id: "a5", name: "A 5" }, taskTypeId: { _id: "t5", name: "T5" } },
    ]

    const taskFindQuery = {
      sort: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockTasks),
            }),
          }),
        }),
      }),
    }
    vi.mocked(Task.find).mockReturnValue(taskFindQuery as any)

    const result = await listPagesService("507f1f77bcf86cd799439011", { userId: "user1", role: "MANGAKA" })

    expect(result).toHaveLength(5)
    expect(result[0].activeTask?.status).toBe("TODO")
    expect(result[1].activeTask?.status).toBe("IN_PROGRESS")
    expect(result[2].activeTask?.status).toBe("SUBMITTED")
    expect(result[3].activeTask?.status).toBe("REVISION_REQUESTED")
    expect(result[4].activeTask?.status).toBe("MANGAKA_APPROVED")
  })

  it("does not return activeTask for EDITOR_APPROVED, REJECTED, CANCELLED tasks (they should not be fetched by Task.find)", async () => {
    const mockPages = [
      { _id: "page1" },
    ]

    const pageFindQuery = {
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockPages) }),
    }
    vi.mocked(Page.find).mockReturnValue(pageFindQuery as any)

    const taskFindQuery = {
      sort: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    }
    vi.mocked(Task.find).mockReturnValue(taskFindQuery as any)

    const result = await listPagesService("507f1f77bcf86cd799439011", { userId: "user1", role: "MANGAKA" })

    expect(Task.find).toHaveBeenCalledWith({
      chapterId: "507f1f77bcf86cd799439011",
      status: { $in: ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"] },
    })

    expect(result[0].activeTask).toBeUndefined()
  })

  it("returns the most recent task when there are legacy duplicate active tasks for the same page", async () => {
    const mockPages = [
      { _id: "page1" },
    ]

    const pageFindQuery = {
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockPages) }),
    }
    vi.mocked(Page.find).mockReturnValue(pageFindQuery as any)

    const mockTasks = [
      { _id: "task1_new", pageId: "page1", status: "IN_PROGRESS" },
      { _id: "task1_old", pageId: "page1", status: "TODO" },
    ]

    const taskFindQuery = {
      sort: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockTasks),
            }),
          }),
        }),
      }),
    }
    vi.mocked(Task.find).mockReturnValue(taskFindQuery as any)

    const result = await listPagesService("507f1f77bcf86cd799439011", { userId: "user1", role: "MANGAKA" })

    expect(taskFindQuery.sort).toHaveBeenCalledWith({ createdAt: -1 })
    // Since Array.find returns the first match and tasks are sorted by createdAt: -1
    // it will return the newest one.
    expect(result[0].activeTask?.id).toBe("task1_new")
    expect(result[0].activeTask?.status).toBe("IN_PROGRESS")
  })
})
