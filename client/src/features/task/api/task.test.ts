import { afterEach, describe, expect, it, vi } from "vitest";
import { createTaskFromRegion, deleteTask, listTasks, startTask } from "./task";

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

const task = {
  id: "task_1",
  seriesId: "series_1",
  chapterId: "chapter_1",
  pageId: "page_1",
  regionId: "region_1",
  assignedBy: "mangaka_1",
  assignedTo: "assistant_1",
  title: "Ink panel",
  description: "Finish line art",
  type: "INKING",
  priority: "HIGH",
  status: "TODO",
  revisionRound: 0,
  baseRate: 1200,
  bonusAmount: 200,
  dueDate: "2026-06-10T00:00:00.000Z",
  createdAt: "2026-06-03T00:00:00.000Z",
  updatedAt: "2026-06-03T00:00:00.000Z"
};

describe("task API client", () => {
  it("lists tasks with bearer auth", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        success: true,
        data: [task]
      })
    );

    await expect(listTasks("token_1")).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/tasks", {
      headers: {
        Authorization: "Bearer token_1"
      }
    });
  });

  it("creates a task from a region", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        success: true,
        data: task
      })
    );

    await createTaskFromRegion("token_1", "region_1", {
      assignedTo: "assistant_1",
      title: "Ink panel",
      description: "Finish line art",
      type: "INKING",
      priority: "HIGH",
      dueDate: "2026-06-10",
      baseRate: 1200,
      bonusAmount: 200
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/regions/region_1/create-task",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          assignedTo: "assistant_1",
          title: "Ink panel",
          description: "Finish line art",
          type: "INKING",
          priority: "HIGH",
          dueDate: "2026-06-10",
          baseRate: 1200,
          bonusAmount: 200
        })
      })
    );
  });

  it("starts and deletes tasks while surfacing API errors", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: { ...task, status: "IN_PROGRESS" }
      })
    );

    await expect(startTask("token_1", "task_1")).resolves.toMatchObject({ status: "IN_PROGRESS" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/tasks/task_1/start",
      expect.objectContaining({ method: "POST" })
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: { deleted: true }
      })
    );
    await expect(deleteTask("token_1", "task_1")).resolves.toBe(true);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          message: "Only the assigned assistant can start this task"
        },
        403
      )
    );
    await expect(startTask("token_1", "task_1")).rejects.toThrow("Only the assigned assistant can start this task");
  });
});
