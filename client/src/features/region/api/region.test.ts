import { afterEach, describe, expect, it, vi } from "vitest";
import { createRegion, deleteRegion, listRegions } from "./region";

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

describe("region API client", () => {
  it("lists regions for a page with bearer auth", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        success: true,
        data: [
          {
            id: "region_1",
            pageId: "page_1",
            type: "BUBBLE",
            source: "MANUAL",
            shape: "RECTANGLE",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.4,
            createdBy: "user_1",
            createdAt: "2026-06-03T00:00:00.000Z",
            updatedAt: "2026-06-03T00:00:00.000Z"
          }
        ]
      })
    );

    await expect(listRegions("token_1", "page_1")).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/pages/page_1/regions", {
      headers: {
        Authorization: "Bearer token_1"
      }
    });
  });

  it("creates manual rectangle regions by default", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        success: true,
        data: {
          id: "region_1",
          pageId: "page_1",
          type: "CLEANUP",
          source: "MANUAL",
          shape: "RECTANGLE",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
          createdBy: "user_1",
          createdAt: "2026-06-03T00:00:00.000Z",
          updatedAt: "2026-06-03T00:00:00.000Z"
        }
      })
    );

    await createRegion("token_1", "page_1", {
      type: "CLEANUP",
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/pages/page_1/regions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "CLEANUP",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
          source: "MANUAL",
          shape: "RECTANGLE"
        })
      })
    );
  });

  it("deletes regions and surfaces API errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: { deleted: true }
      })
    );

    await expect(deleteRegion("token_1", "region_1")).resolves.toBe(true);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          message: "Insufficient series role"
        },
        403
      )
    );

    await expect(listRegions("token_1", "page_1")).rejects.toThrow("Insufficient series role");
  });
});
