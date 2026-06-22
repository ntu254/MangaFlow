import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("./_client", () => ({
  api: { get },
  unwrap: <T>(response: { data: { data: T } }) => response.data.data,
}));

import { auditLogsApi } from "./admin";

describe("auditLogsApi", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("calls the admin audit logs endpoint with filters and pagination", async () => {
    get.mockResolvedValueOnce({
      data: {
        data: {
          logs: [],
          pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
        },
      },
    });

    const result = await auditLogsApi.list({
      action: "USER_ROLE_UPDATED",
      actorId: "actor1",
      targetId: "target1",
      page: 2,
    });

    expect(get).toHaveBeenCalledWith("/admin/audit-logs", {
      params: {
        limit: 20,
        action: "USER_ROLE_UPDATED",
        actorId: "actor1",
        targetId: "target1",
        page: 2,
      },
    });
    expect(result.pagination.page).toBe(2);
  });
});
