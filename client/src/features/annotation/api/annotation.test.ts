import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnnotation, deleteAnnotation, listAnnotations, updateAnnotation } from "./annotation";

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

describe("annotation API client", () => {
  it("lists annotations for a page with bearer auth", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        success: true,
        data: [
          {
            id: "annotation_1",
            pageId: "page_1",
            createdBy: "user_1",
            targetType: "PAGE",
            targetId: "page_1",
            type: "RECTANGLE",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.4,
            status: "OPEN",
            createdAt: "2026-06-03T00:00:00.000Z",
            updatedAt: "2026-06-03T00:00:00.000Z"
          }
        ]
      })
    );

    await expect(listAnnotations("token_1", "page_1")).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/pages/page_1/annotations", {
      headers: {
        Authorization: "Bearer token_1"
      }
    });
  });

  it("creates page rectangle annotations with comment and optional region", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        success: true,
        data: {
          id: "annotation_1",
          pageId: "page_1",
          createdBy: "user_1",
          targetType: "PAGE",
          targetId: "page_1",
          regionId: "region_1",
          type: "RECTANGLE",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
          comment: "Needs revision",
          status: "OPEN",
          createdAt: "2026-06-03T00:00:00.000Z",
          updatedAt: "2026-06-03T00:00:00.000Z"
        }
      })
    );

    await createAnnotation("token_1", "page_1", {
      regionId: "region_1",
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
      comment: "Needs revision"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/pages/page_1/annotations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          targetType: "PAGE",
          targetId: "page_1",
          type: "RECTANGLE",
          regionId: "region_1",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
          comment: "Needs revision"
        })
      })
    );
  });

  it("updates and deletes annotations while surfacing API errors", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: {
          id: "annotation_1",
          pageId: "page_1",
          createdBy: "user_1",
          targetType: "PAGE",
          targetId: "page_1",
          type: "RECTANGLE",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
          status: "RESOLVED",
          createdAt: "2026-06-03T00:00:00.000Z",
          updatedAt: "2026-06-03T00:00:00.000Z"
        }
      })
    );

    await updateAnnotation("token_1", "annotation_1", { status: "RESOLVED" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/annotations/annotation_1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED" })
      })
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: { deleted: true }
      })
    );
    await expect(deleteAnnotation("token_1", "annotation_1")).resolves.toBe(true);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          message: "Only creator, editor, or admin can mutate annotations"
        },
        403
      )
    );
    await expect(updateAnnotation("token_1", "annotation_1", { status: "OPEN" })).rejects.toThrow(
      "Only creator, editor, or admin can mutate annotations"
    );
  });
});
