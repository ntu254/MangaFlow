import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "../../shared/errors/AppError.js"

const controllerMocks = vi.hoisted(() => ({
  createTaskSubmission: vi.fn(),
  getTaskUploadUrl: vi.fn(),
  listTaskSubmissions: vi.fn(),
  listReviewQueueSubmissions: vi.fn(),
  mangakaApproveSubmission: vi.fn(),
  requestSubmissionRevision: vi.fn(),
  rejectSubmission: vi.fn(),
  editorApproveSubmission: vi.fn(),
  editorRejectSubmission: vi.fn(),
  listAllSubmissions: vi.fn(),
}))

vi.mock("./submission.controller.js", () => controllerMocks)
vi.mock("../../shared/middleware/requireAuth.js", () => ({
  requireAuth: vi.fn((_req, _res, next) => next()),
}))
vi.mock("../../shared/middleware/validate.js", () => ({
  validate: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}))

import router from "./submission.routes.js"

function routeHandler(path: string, method: "get" | "post") {
  const layer = (router as any).stack.find(
    (candidate: any) => candidate.route?.path === path && candidate.route?.methods?.[method],
  )
  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`)
  return layer.route.stack.at(-1).handle as (
    req: unknown,
    res: unknown,
    next: (error?: unknown) => void,
  ) => void
}

describe("submission route async error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ["createTaskSubmission", "post", "/tasks/:taskId/submissions"],
    ["getTaskUploadUrl", "post", "/tasks/:taskId/submissions/upload-url"],
    ["listTaskSubmissions", "get", "/tasks/:taskId/submissions"],
    ["listReviewQueueSubmissions", "get", "/submissions/review-queue"],
    ["mangakaApproveSubmission", "post", "/submissions/:submissionId/mangaka-approve"],
    ["requestSubmissionRevision", "post", "/submissions/:submissionId/request-revision"],
    ["rejectSubmission", "post", "/submissions/:submissionId/reject"],
    ["editorApproveSubmission", "post", "/submissions/:submissionId/editor-approve"],
    ["editorRejectSubmission", "post", "/submissions/:submissionId/editor-reject"],
    ["listAllSubmissions", "get", "/submissions"],
  ] as const)("forwards rejected %s promises to Express error middleware", async (controllerName, method, path) => {
    const error = new AppError("Submission transition failed", 409)
    controllerMocks[controllerName].mockRejectedValue(error)
    const next = vi.fn()

    routeHandler(path, method)({}, {}, next)

    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(error))
  })
})
