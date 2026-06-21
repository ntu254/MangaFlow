import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppError } from "../../shared/errors/AppError.js"
import {
  createTaskService,
  getTaskService,
  listTasksBySeriesService,
  updateTaskStatusService,
} from "./task.service.js"
import * as taskRepository from "./task.repository.js"
import { SeriesMember } from "../series/series.model.js"
import { Page } from "../chapter/chapter.model.js"

const taskScopeGuardMock = vi.hoisted(() => ({
  validateTaskCreationScope: vi.fn(),
}))

vi.mock("./task.repository.js")
vi.mock("./guards/task-scope.guard.js", () => ({
  validateTaskCreationScope: taskScopeGuardMock.validateTaskCreationScope,
}))
vi.mock("./policies/task-assignment.policy.js", () => ({
  assertTaskAssignmentAllowed: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("../series/series.model.js", () => ({
  SeriesMember: {
    findOne: vi.fn(),
  },
}))
vi.mock("./task.model.js", () => ({
  Task: {
    findOne: vi.fn().mockResolvedValue(null),
  },
}))
vi.mock("../chapter/chapter.model.js", () => ({
  Chapter: {
    findById: vi.fn(),
  },
  Page: {
    findByIdAndUpdate: vi.fn(),
  },
  Region: {
    findByIdAndUpdate: vi.fn(),
  },
}))

describe("createTaskService", () => {
  const mockInput = {
    seriesId: "507f1f77bcf86cd799439011",
    chapterId: "507f1f77bcf86cd799439012",
    pageId: "507f1f77bcf86cd799439018",
    taskTypeId: "507f1f77bcf86cd799439013",
    assignedTo: "507f1f77bcf86cd799439014",
    assignedBy: "507f1f77bcf86cd799439016",
    title: "Test Task",
    description: undefined,
    priority: undefined,
    dueDate: new Date(Date.now() + 86400000), // tomorrow
    contextPageIds: undefined,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    taskScopeGuardMock.validateTaskCreationScope.mockResolvedValue({ taskType: { baseRate: 100 } })
  })

  it("throws AppError if title is empty", async () => {
    await expect(
      createTaskService({ ...mockInput, title: "" })
    ).rejects.toThrow(AppError)
  })

  it("throws AppError if dueDate is not a future date", async () => {
    await expect(
      createTaskService({ ...mockInput, dueDate: new Date(Date.now() - 86400000) })
    ).rejects.toThrow(AppError)
  })

  it("calls createTaskRecord with normalized input", async () => {
    const mockResult = { id: "507f1f77bcf86cd799439017", seriesId: "507f1f77bcf86cd799439011", chapterId: "507f1f77bcf86cd799439012", taskTypeId: "507f1f77bcf86cd799439013", assignedTo: "507f1f77bcf86cd799439014", assignedBy: "507f1f77bcf86cd799439016", title: "Test Task", status: "TODO", priority: "NORMAL", baseRate: 100, dueDate: mockInput.dueDate, contextPageIds: [], createdAt: new Date(), updatedAt: new Date() }
    vi.mocked(taskRepository.createTaskRecord).mockResolvedValue(mockResult as any)

    const result = await createTaskService(mockInput)

    expect(taskRepository.createTaskRecord).toHaveBeenCalledWith({
      seriesId: mockInput.seriesId,
      chapterId: mockInput.chapterId,
      pageId: mockInput.pageId,
      taskTypeId: mockInput.taskTypeId,
      assignedTo: mockInput.assignedTo,
      assignedBy: mockInput.assignedBy,
      title: mockInput.title,
      description: mockInput.description,
      priority: mockInput.priority,
      dueDate: mockInput.dueDate,
      contextPageIds: mockInput.contextPageIds,
      baseRate: 100,
    })
    expect(result).toMatchObject({ id: "507f1f77bcf86cd799439017", baseRate: 100, status: "TODO" })
    expect(Page.findByIdAndUpdate).toHaveBeenCalledWith(mockInput.pageId, { status: "IN_TASK" })
  })

  it("snapshots the current TaskType base rate for payroll history", async () => {
    taskScopeGuardMock.validateTaskCreationScope.mockResolvedValue({ taskType: { baseRate: 275 } })
    const mockResult = { id: "507f1f77bcf86cd799439017", seriesId: "507f1f77bcf86cd799439011", chapterId: "507f1f77bcf86cd799439012", taskTypeId: "507f1f77bcf86cd799439013", assignedTo: "507f1f77bcf86cd799439014", assignedBy: "507f1f77bcf86cd799439016", title: "Test Task", status: "TODO", priority: "NORMAL", baseRate: 275, dueDate: mockInput.dueDate, contextPageIds: [], createdAt: new Date(), updatedAt: new Date() }
    vi.mocked(taskRepository.createTaskRecord).mockResolvedValue(mockResult as any)

    const result = await createTaskService(mockInput)

    expect(taskRepository.createTaskRecord).toHaveBeenCalledWith(expect.objectContaining({
      taskTypeId: mockInput.taskTypeId,
      baseRate: 275,
    }))
    expect(result).toMatchObject({ id: "507f1f77bcf86cd799439017", baseRate: 275 })
  })
})

describe("task access service rules", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("allows an Assistant to open only their assigned task", async () => {
    const task = { id: "507f1f77bcf86cd799439017", seriesId: "507f1f77bcf86cd799439011", assignedTo: "507f1f77bcf86cd799439014" }
    vi.mocked(taskRepository.getTaskById).mockResolvedValue(task as any)

    const result = await getTaskService("507f1f77bcf86cd799439017", { userId: "507f1f77bcf86cd799439014", role: "ASSISTANT" })

    expect(result).toEqual(task)
    expect(SeriesMember.findOne).not.toHaveBeenCalled()
  })

  it("blocks an Assistant from opening another Assistant's task", async () => {
    vi.mocked(taskRepository.getTaskById).mockResolvedValue({
      id: "507f1f77bcf86cd799439017",
      seriesId: "507f1f77bcf86cd799439011",
      assignedTo: "507f1f77bcf86cd799439015",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)

    await expect(
      getTaskService("507f1f77bcf86cd799439017", { userId: "507f1f77bcf86cd799439014", role: "ASSISTANT" }),
    ).rejects.toThrow("Assistant access is limited to assigned tasks")
  })

  it("filters Series task lists to the current Assistant assignment only", async () => {
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)
    vi.mocked(taskRepository.listTasksBySeries).mockResolvedValue([])

    await listTasksBySeriesService("507f1f77bcf86cd799439011", { userId: "507f1f77bcf86cd799439014", role: "ASSISTANT" }, { status: "TODO" })

    expect(taskRepository.listTasksBySeries).toHaveBeenCalledWith("507f1f77bcf86cd799439011", {
      status: "TODO",
      assignedTo: "507f1f77bcf86cd799439014",
    })
  })

  it("blocks Assistants from manager task updates", async () => {
    vi.mocked(taskRepository.getTaskById).mockResolvedValue({
      id: "507f1f77bcf86cd799439017",
      seriesId: "507f1f77bcf86cd799439011",
      assignedTo: "507f1f77bcf86cd799439014",
      status: "TODO",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)

    await expect(
      updateTaskStatusService("507f1f77bcf86cd799439017", { userId: "507f1f77bcf86cd799439014", role: "ASSISTANT" }, "SUBMITTED"),
    ).rejects.toThrow("Only active Mangaka or Editor series members can manage tasks")
  })

  it.each([
    "SUBMITTED",
    "MANGAKA_APPROVED",
    "EDITOR_APPROVED",
    "REVISION_REQUESTED",
    "REJECTED",
  ] as const)("blocks generic task status updates to review-owned status %s", async (status) => {
    vi.mocked(taskRepository.getTaskById).mockResolvedValue({
      id: "507f1f77bcf86cd799439017",
      seriesId: "507f1f77bcf86cd799439011",
      assignedTo: "507f1f77bcf86cd799439014",
      status: "TODO",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "MANGAKA",
    } as any)

    await expect(
      updateTaskStatusService(
        "507f1f77bcf86cd799439017",
        { userId: "507f1f77bcf86cd799439016", role: "MANGAKA" },
        status,
      ),
    ).rejects.toThrow("Submission review statuses cannot be changed through the generic task endpoint")

    expect(taskRepository.updateTaskStatus).not.toHaveBeenCalled()
  })

  it("blocks generic status changes once submission review has started", async () => {
    vi.mocked(taskRepository.getTaskById).mockResolvedValue({
      id: "507f1f77bcf86cd799439017",
      seriesId: "507f1f77bcf86cd799439011",
      assignedTo: "507f1f77bcf86cd799439014",
      status: "SUBMITTED",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "MANGAKA",
    } as any)

    await expect(
      updateTaskStatusService(
        "507f1f77bcf86cd799439017",
        { userId: "507f1f77bcf86cd799439016", role: "MANGAKA" },
        "TODO",
      ),
    ).rejects.toThrow("Only TODO or IN_PROGRESS tasks can be changed through the generic task endpoint")

    expect(taskRepository.updateTaskStatus).not.toHaveBeenCalled()
  })

  it("preserves the assigned Assistant TODO to IN_PROGRESS transition", async () => {
    vi.mocked(taskRepository.getTaskById).mockResolvedValue({
      id: "507f1f77bcf86cd799439017",
      seriesId: "507f1f77bcf86cd799439011",
      assignedTo: "507f1f77bcf86cd799439014",
      status: "TODO",
    } as any)
    vi.mocked(taskRepository.updateTaskStatus).mockResolvedValue({
      id: "507f1f77bcf86cd799439017",
      status: "IN_PROGRESS",
    } as any)

    await expect(
      updateTaskStatusService(
        "507f1f77bcf86cd799439017",
        { userId: "507f1f77bcf86cd799439014", role: "ASSISTANT" },
        "IN_PROGRESS",
      ),
    ).resolves.toMatchObject({ status: "IN_PROGRESS" })
  })

  it("preserves manager cancellation before submission review starts", async () => {
    vi.mocked(taskRepository.getTaskById).mockResolvedValue({
      id: "507f1f77bcf86cd799439017",
      seriesId: "507f1f77bcf86cd799439011",
      assignedTo: "507f1f77bcf86cd799439014",
      status: "IN_PROGRESS",
    } as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "MANGAKA",
    } as any)
    vi.mocked(taskRepository.updateTaskStatus).mockResolvedValue({
      id: "507f1f77bcf86cd799439017",
      status: "CANCELLED",
    } as any)

    await expect(
      updateTaskStatusService(
        "507f1f77bcf86cd799439017",
        { userId: "507f1f77bcf86cd799439016", role: "MANGAKA" },
        "CANCELLED",
      ),
    ).resolves.toMatchObject({ status: "CANCELLED" })
  })
})

