import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "../../shared/errors/AppError.js"
import { SeriesMember } from "../series/series.model.js"
import * as repository from "./submission.repository.js"
import {
  createTaskSubmissionService,
  editorApproveSubmissionService,
  listReviewQueueSubmissionsService,
  mangakaApproveSubmissionService,
  rejectSubmissionService,
  requestSubmissionRevisionService,
} from "./submission.service.js"

const fileAssetMocks = vi.hoisted(() => ({
  findById: vi.fn(),
}))
const fileServiceMocks = vi.hoisted(() => ({
  checkObjectExists: vi.fn(),
}))

vi.mock("./submission.repository.js")
vi.mock("../chapter/chapter.model.js", () => ({
  FileAsset: { findById: fileAssetMocks.findById },
}))
vi.mock("../chapter/file.service.js", () => ({
  createPresignedUploadUrl: vi.fn(),
  checkObjectExists: fileServiceMocks.checkObjectExists,
}))
vi.mock("../series/series.model.js", () => ({
  SeriesMember: {
    findOne: vi.fn(),
    find: vi.fn(),
  },
}))

describe("submission review service", () => {
  const task = {
    _id: "task1",
    seriesId: "series1",
    chapterId: "chapter1",
    assignedTo: "assistant1",
    status: "TODO",
  }

  const submittedTask = { ...task, status: "SUBMITTED", currentSubmissionId: "submission1" }
  const mangakaApprovedTask = {
    ...task,
    status: "MANGAKA_APPROVED",
    currentSubmissionId: "submission1",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    fileServiceMocks.checkObjectExists.mockResolvedValue(true)
  })

  it("lets the assigned Assistant create a new submitted version and moves task to SUBMITTED", async () => {
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(task as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)
    vi.mocked(repository.createSubmissionRecord).mockResolvedValue({
      _id: "submission1",
      id: "submission1",
      status: "SUBMITTED",
      version: 1,
    } as any)
    vi.mocked(repository.updateTaskForNewSubmission).mockResolvedValue({
      ...task,
      status: "SUBMITTED",
      currentSubmissionId: "submission1",
    } as any)

    const result = await createTaskSubmissionService({
      taskId: "task1",
      actor: { userId: "assistant1", role: "ASSISTANT" },
      resultText: "Cleaned page",
    })

    expect(result).toMatchObject({ status: "SUBMITTED", version: 1 })
    expect(repository.updateTaskForNewSubmission).toHaveBeenCalledWith(
      "task1",
      "submission1",
    )
  })

  it("rejects a submission when its file asset does not exist", async () => {
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(task as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)
    fileAssetMocks.findById.mockResolvedValue(null)

    await expect(
      createTaskSubmissionService({
        taskId: "task1",
        actor: { userId: "assistant1", role: "ASSISTANT" },
        fileAssetId: "missing-file",
      }),
    ).rejects.toThrow("Submission file asset not found")

    expect(repository.createSubmissionRecord).not.toHaveBeenCalled()
  })

  it("rejects a submission when its file asset is not active or uploaded", async () => {
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(task as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)
    fileAssetMocks.findById.mockResolvedValue({
      _id: "file1",
      uploadedBy: "assistant1",
      assetType: "production",
      status: "ACTIVE",
      r2Key: "uploads/file1.psd",
    })
    fileServiceMocks.checkObjectExists.mockResolvedValue(false)

    await expect(
      createTaskSubmissionService({
        taskId: "task1",
        actor: { userId: "assistant1", role: "ASSISTANT" },
        fileAssetId: "file1",
      }),
    ).rejects.toThrow("Submission file upload is not complete")

    expect(repository.createSubmissionRecord).not.toHaveBeenCalled()
  })

  it("rejects a submission when the file asset lifecycle status is not active", async () => {
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(task as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)
    fileAssetMocks.findById.mockResolvedValue({
      _id: "file1",
      uploadedBy: "assistant1",
      assetType: "production",
      status: "MISSING",
      r2Key: "uploads/file1.psd",
    })

    await expect(
      createTaskSubmissionService({
        taskId: "task1",
        actor: { userId: "assistant1", role: "ASSISTANT" },
        fileAssetId: "file1",
      }),
    ).rejects.toThrow("Submission file asset is not active")

    expect(fileServiceMocks.checkObjectExists).not.toHaveBeenCalled()
    expect(repository.createSubmissionRecord).not.toHaveBeenCalled()
  })

  it("rejects a submission when the file asset belongs to another user", async () => {
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(task as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)
    fileAssetMocks.findById.mockResolvedValue({
      _id: "file1",
      uploadedBy: "assistant2",
      assetType: "production",
      status: "ACTIVE",
      r2Key: "uploads/file1.psd",
    })

    await expect(
      createTaskSubmissionService({
        taskId: "task1",
        actor: { userId: "assistant1", role: "ASSISTANT" },
        fileAssetId: "file1",
      }),
    ).rejects.toThrow("Submission file asset belongs to another user")

    expect(repository.createSubmissionRecord).not.toHaveBeenCalled()
  })

  it("rejects a submission when the file asset is not a production asset", async () => {
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(task as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    } as any)
    fileAssetMocks.findById.mockResolvedValue({
      _id: "file1",
      uploadedBy: "assistant1",
      assetType: "manuscript",
      status: "ACTIVE",
      r2Key: "uploads/file1.pdf",
    })

    await expect(
      createTaskSubmissionService({
        taskId: "task1",
        actor: { userId: "assistant1", role: "ASSISTANT" },
        fileAssetId: "file1",
      }),
    ).rejects.toThrow("Submission requires a production file asset")

    expect(repository.createSubmissionRecord).not.toHaveBeenCalled()
  })

  it("blocks Assistants from submitting someone else's task", async () => {
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue({
      ...task,
      assignedTo: "assistant2",
    } as any)

    await expect(
      createTaskSubmissionService({
        taskId: "task1",
        actor: { userId: "assistant1", role: "ASSISTANT" },
        resultText: "Nope",
      }),
    ).rejects.toThrow("Assistant can submit only their assigned task")
  })

  it("blocks submit when the system role is not ASSISTANT even if membership is wrong", async () => {
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(task as any)

    await expect(
      createTaskSubmissionService({
        taskId: "task1",
        actor: { userId: "assistant1", role: "MANGAKA" },
        resultText: "Nope",
      }),
    ).rejects.toThrow("Submission review access denied")
  })

  it("lets Mangaka approve submitted work and moves task to MANGAKA_APPROVED", async () => {
    vi.mocked(repository.getSubmissionById).mockResolvedValue({
      _id: "submission1",
      taskId: "task1",
      status: "SUBMITTED",
    } as any)
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(submittedTask as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "MANGAKA",
    } as any)
    vi.mocked(repository.updateSubmissionStatus).mockResolvedValue({
      id: "submission1",
      status: "MANGAKA_APPROVED",
    } as any)

    const result = await mangakaApproveSubmissionService({
      submissionId: "submission1",
      actor: { userId: "mangaka1", role: "MANGAKA" },
    })

    expect(result).toMatchObject({ status: "MANGAKA_APPROVED" })
    expect(repository.updateTaskStatusForSubmission).toHaveBeenCalledWith(
      "task1",
      "MANGAKA_APPROVED",
    )
  })

  it("blocks review actions against a superseded submission version", async () => {
    vi.mocked(repository.getSubmissionById).mockResolvedValue({
      _id: "submission1",
      taskId: "task1",
      status: "SUBMITTED",
    } as any)
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue({
      ...submittedTask,
      currentSubmissionId: "submission2",
    } as any)

    await expect(
      mangakaApproveSubmissionService({
        submissionId: "submission1",
        actor: { userId: "mangaka1", role: "MANGAKA" },
      }),
    ).rejects.toThrow("Review action must target the task's current submission")

    expect(repository.updateSubmissionStatus).not.toHaveBeenCalled()
    expect(repository.updateTaskStatusForSubmission).not.toHaveBeenCalled()
  })

  it("blocks Editor final approval before Mangaka approval", async () => {
    vi.mocked(repository.getSubmissionById).mockResolvedValue({
      _id: "submission1",
      taskId: "task1",
      status: "SUBMITTED",
    } as any)
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(submittedTask as any)
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "EDITOR",
    } as any)

    await expect(
      editorApproveSubmissionService({
        submissionId: "submission1",
        actor: { userId: "editor1", role: "EDITOR" },
      }),
    ).rejects.toThrow("Editor final approval requires Mangaka approval first")
  })

  it("lets Editor final-approve only after Mangaka approval and moves task to EDITOR_APPROVED", async () => {
    vi.mocked(repository.getSubmissionById).mockResolvedValue({
      _id: "submission1",
      taskId: "task1",
      status: "MANGAKA_APPROVED",
    } as any)
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(
      mangakaApprovedTask as any,
    )
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "EDITOR",
    } as any)
    vi.mocked(repository.updateSubmissionStatus).mockResolvedValue({
      id: "submission1",
      status: "EDITOR_APPROVED",
    } as any)

    const result = await editorApproveSubmissionService({
      submissionId: "submission1",
      actor: { userId: "editor1", role: "EDITOR" },
    })

    expect(result).toMatchObject({ status: "EDITOR_APPROVED" })
    expect(repository.updateTaskStatusForSubmission).toHaveBeenCalledWith(
      "task1",
      "EDITOR_APPROVED",
    )
  })

  it("lets Editor request revision after Mangaka approval", async () => {
    vi.mocked(repository.getSubmissionById).mockResolvedValue({
      _id: "submission1",
      taskId: "task1",
      status: "MANGAKA_APPROVED",
    } as any)
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(
      mangakaApprovedTask as any,
    )
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "EDITOR",
    } as any)
    vi.mocked(repository.updateSubmissionStatus).mockResolvedValue({
      id: "submission1",
      status: "REVISION_REQUESTED",
    } as any)

    await requestSubmissionRevisionService({
      submissionId: "submission1",
      actor: { userId: "editor1", role: "EDITOR" },
      reviewerNote: "Needs cleanup",
    })

    expect(repository.updateTaskStatusForSubmission).toHaveBeenCalledWith(
      "task1",
      "REVISION_REQUESTED",
    )
  })

  it("allows rejection only before Mangaka approval", async () => {
    vi.mocked(repository.getSubmissionById).mockResolvedValue({
      _id: "submission1",
      taskId: "task1",
      status: "MANGAKA_APPROVED",
    } as any)
    vi.mocked(repository.getTaskForSubmission).mockResolvedValue(
      mangakaApprovedTask as any,
    )
    vi.mocked(SeriesMember.findOne).mockResolvedValue({
      isActive: true,
      role: "MANGAKA",
    } as any)

    await expect(
      rejectSubmissionService({
        submissionId: "submission1",
        actor: { userId: "mangaka1", role: "MANGAKA" },
      }),
    ).rejects.toThrow(AppError)
  })

  it("lists Mangaka review queue submissions for active Mangaka memberships", async () => {
    vi.mocked(SeriesMember.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ seriesId: "series1" }]),
    } as any)
    vi.mocked(repository.listReviewQueueSubmissions).mockResolvedValue([{ id: "submission1", status: "SUBMITTED" }] as any)

    const result = await listReviewQueueSubmissionsService({ userId: "mangaka1", role: "MANGAKA" })

    expect(repository.listReviewQueueSubmissions).toHaveBeenCalledWith(["series1"], "SUBMITTED")
    expect(result).toEqual([{ id: "submission1", status: "SUBMITTED" }])
  })

  it("lists Editor review queue submissions after Mangaka approval", async () => {
    vi.mocked(SeriesMember.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ seriesId: "series1" }]),
    } as any)
    vi.mocked(repository.listReviewQueueSubmissions).mockResolvedValue([{ id: "submission1", status: "MANGAKA_APPROVED" }] as any)

    const result = await listReviewQueueSubmissionsService({ userId: "editor1", role: "EDITOR" })

    expect(repository.listReviewQueueSubmissions).toHaveBeenCalledWith(["series1"], "MANGAKA_APPROVED")
    expect(result).toEqual([{ id: "submission1", status: "MANGAKA_APPROVED" }])
  })

  it("blocks Assistants from review queue access", async () => {
    await expect(
      listReviewQueueSubmissionsService({ userId: "assistant1", role: "ASSISTANT" }),
    ).rejects.toThrow("Review queue access denied")
  })
})
