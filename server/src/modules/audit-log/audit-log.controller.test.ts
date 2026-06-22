import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "../../shared/errors/AppError.js"

const find = vi.fn()
const countDocuments = vi.fn()

vi.mock("../../shared/workflow/events.js", () => ({
  AuditLog: {
    find,
    countDocuments,
  },
}))

const { listAuditLogs } = await import("./audit-log.controller.js")

function createFindChain(logs: any[]) {
  return {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    populate: vi.fn().mockResolvedValue(logs),
  }
}

function createResponse() {
  return {
    json: vi.fn(),
  } as any
}

describe("audit log controller", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    countDocuments.mockResolvedValue(1)
  })

  it("lists audit logs with default pagination", async () => {
    const chain = createFindChain([
      {
        _id: "log1",
        actorId: { _id: "actor1", name: "Admin" },
        event: "CONFIG_UPDATED",
        entityId: "target1",
        entityType: "TaskType",
        metadata: { action: "TASK_TYPE_UPDATED" },
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-01T00:00:00.000Z"),
      },
    ])
    find.mockReturnValue(chain)
    const res = createResponse()

    await listAuditLogs({ query: {} } as any, res)

    expect(find).toHaveBeenCalledWith({})
    expect(chain.skip).toHaveBeenCalledWith(0)
    expect(chain.limit).toHaveBeenCalledWith(20)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        logs: [expect.objectContaining({ action: "CONFIG_UPDATED", targetModel: "TaskType" })],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    }))
  })

  it("filters by action, actorId, and targetId", async () => {
    const actorId = "507f1f77bcf86cd799439011"
    const targetId = "507f1f77bcf86cd799439012"
    find.mockReturnValue(createFindChain([]))
    countDocuments.mockResolvedValue(0)

    await listAuditLogs({ query: { action: "USER_ROLE_UPDATED", actorId, targetId } } as any, createResponse())

    expect(find).toHaveBeenCalledWith({
      event: "USER_ROLE_UPDATED",
      actorId,
      entityId: targetId,
    })
    expect(countDocuments).toHaveBeenCalledWith({
      event: "USER_ROLE_UPDATED",
      actorId,
      entityId: targetId,
    })
  })

  it("rejects invalid ObjectId filters", async () => {
    await expect(listAuditLogs({ query: { actorId: "bad-id" } } as any, createResponse()))
      .rejects.toMatchObject(new AppError("Invalid actorId", 400))
    expect(find).not.toHaveBeenCalled()
  })

  it("clamps non-positive page and oversized limit", async () => {
    const chain = createFindChain([])
    find.mockReturnValue(chain)
    countDocuments.mockResolvedValue(0)

    await listAuditLogs({ query: { page: "0", limit: "500" } } as any, createResponse())

    expect(chain.skip).toHaveBeenCalledWith(0)
    expect(chain.limit).toHaveBeenCalledWith(100)
  })
})
