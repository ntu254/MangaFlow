import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("./_client", () => ({
  api: { post },
  unwrap: <T>(response: { data: { data: T } }) => response.data.data,
}));

import { submitTaskSubmission } from "./submissions";

describe("submitTaskSubmission", () => {
  beforeEach(() => {
    post.mockReset();
    vi.unstubAllGlobals();
  });

  it("uploads the selected file and creates a versioned task submission", async () => {
    const file = new File(["page-data"], "page.psd", {
      type: "application/octet-stream",
    });
    const upload = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", upload);

    post
      .mockResolvedValueOnce({
        data: {
          data: {
            uploadUrl: "https://uploads.example.test/task-file",
            fileAssetId: "file-1",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            id: "submission-1",
            taskId: "task-1",
            version: 2,
            status: "SUBMITTED",
          },
        },
      });

    const result = await submitTaskSubmission({
      taskId: "task-1",
      resultText: "Revision complete",
      file,
    });

    expect(post).toHaveBeenNthCalledWith(1, "/tasks/task-1/submissions/upload-url", {
      originalName: "page.psd",
      contentType: "application/octet-stream",
      size: file.size,
    });
    expect(upload).toHaveBeenCalledWith("https://uploads.example.test/task-file", {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: file,
    });
    expect(post).toHaveBeenNthCalledWith(2, "/tasks/task-1/submissions", {
      resultText: "Revision complete",
      fileAssetId: "file-1",
    });
    expect(result).toMatchObject({ id: "submission-1", version: 2, status: "SUBMITTED" });
  });

  it("submits a text-only result without requesting an upload URL", async () => {
    post.mockResolvedValueOnce({
      data: {
        data: {
          id: "submission-1",
          taskId: "task-1",
          version: 1,
          status: "SUBMITTED",
        },
      },
    });

    await submitTaskSubmission({ taskId: "task-1", resultText: "Work completed" });

    expect(post).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith("/tasks/task-1/submissions", {
      resultText: "Work completed",
      fileAssetId: undefined,
    });
  });

  it("does not create a submission when the object upload fails", async () => {
    const file = new File(["page-data"], "page.psd", {
      type: "application/octet-stream",
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    post.mockResolvedValueOnce({
      data: {
        data: {
          uploadUrl: "https://uploads.example.test/task-file",
          fileAssetId: "file-1",
        },
      },
    });

    await expect(submitTaskSubmission({ taskId: "task-1", file })).rejects.toThrow(
      "File upload failed with status 503",
    );
    expect(post).toHaveBeenCalledOnce();
  });
});
