import { afterEach, describe, expect, it, vi } from "vitest";
import { createTaskSubmission, getSubmission, listSubmissions, listTaskSubmissions } from "./submission";

afterEach(() => {
  vi.restoreAllMocks();
});

function mockJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

const submission = {
  id: "submission_1",
  taskId: "task_1",
  submittedBy: "assistant_1",
  fileUrl: "storage://tasks/task_1/submissions/v1/result.png",
  previewUrl: "https://cdn.example.com/result-preview.png",
  note: "Ready for review",
  version: 1,
  status: "PENDING_MANGAKA_REVIEW",
  createdAt: "2026-06-03T00:00:00.000Z",
  updatedAt: "2026-06-03T00:00:00.000Z"
};

describe("submission API client", () => {
  it("lists all visible submissions and task submissions with bearer auth", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        success: true,
        data: [submission]
      })
    );

    await expect(listSubmissions("token_1")).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/submissions", {
      headers: {
        Authorization: "Bearer token_1"
      }
    });

    await expect(listTaskSubmissions("token_1", "task_1")).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/tasks/task_1/submissions", {
      headers: {
        Authorization: "Bearer token_1"
      }
    });
  });

  it("creates task submissions", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        success: true,
        data: submission
      })
    );

    await createTaskSubmission("token_1", "task_1", {
      fileUrl: "storage://tasks/task_1/submissions/v1/result.png",
      previewUrl: "https://cdn.example.com/result-preview.png",
      note: "Ready for review"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/tasks/task_1/submissions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fileUrl: "storage://tasks/task_1/submissions/v1/result.png",
          previewUrl: "https://cdn.example.com/result-preview.png",
          note: "Ready for review"
        })
      })
    );
  });

  it("fetches details and surfaces API errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: submission
      })
    );
    await expect(getSubmission("token_1", "submission_1")).resolves.toMatchObject({ id: "submission_1" });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          message: "Only in-progress or revision-requested tasks can be submitted"
        },
        400
      )
    );
    await expect(
      createTaskSubmission("token_1", "task_1", {
        fileUrl: "storage://tasks/task_1/submissions/v1/result.png"
      })
    ).rejects.toThrow("Only in-progress or revision-requested tasks can be submitted");
  });
});
