import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchCurrentUser,
  fetchRankings,
  fetchUnreadCount,
  mobileEndpoints,
  submitBoardVote
} from "./mobileApi";

const okResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data })
  } as Response);

describe("mobile API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the server auth and notification endpoints", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => okResponse({ id: "u1" }));

    await fetchCurrentUser("token");
    await fetchUnreadCount("token");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5000/api/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5000/api/notifications/unread-count",
      expect.any(Object)
    );
  });

  it("maps rankings and board votes to the actual server routes", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => okResponse([]));

    await fetchRankings("token", "2026-W23");
    await submitBoardVote("token", "series-1", { vote: "APPROVE" });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5000/api/rankings?period=2026-W23",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5000/api/board/series-1/votes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ vote: "APPROVE" })
      })
    );
  });

  it("keeps comments and dashboard out of mobile route constants until server exposes them", () => {
    expect(Object.values(mobileEndpoints)).not.toContain("/dashboard/editor");
    expect(Object.values(mobileEndpoints)).not.toContain("/comments?role=editor");
  });
});
