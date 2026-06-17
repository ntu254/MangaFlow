import type { Request, Response } from "express"
import { AuditLog } from "../../shared/workflow/events.js"

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const query: any = {}
  if (req.query.action) query.event = req.query.action
  if (req.query.targetId) query.entityId = req.query.targetId
  if (req.query.actorId) query.actorId = req.query.actorId

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("actorId", "name email")

  const total = await AuditLog.countDocuments(query)

  const mappedLogs = logs.map(log => ({
    _id: log._id,
    actorId: log.actorId,
    action: log.event,
    targetId: log.entityId,
    targetModel: log.entityType,
    metadata: log.metadata,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt
  }))

  res.json({
    success: true,
    message: "Audit logs retrieved",
    data: {
      logs: mappedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  })
}
