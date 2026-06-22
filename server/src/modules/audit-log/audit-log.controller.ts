import type { Request, Response } from "express"
import mongoose from "mongoose"
import { AppError } from "../../shared/errors/AppError.js"
import { AuditLog } from "../../shared/workflow/events.js"

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const page = parsePositiveInt(req.query.page, 1)
  const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100)
  const skip = (page - 1) * limit

  const query: any = {}
  const action = parseOptionalString(req.query.action)
  const targetId = parseOptionalObjectId(req.query.targetId, "targetId")
  const actorId = parseOptionalObjectId(req.query.actorId, "actorId")

  if (action) query.event = action
  if (targetId) query.entityId = targetId
  if (actorId) query.actorId = actorId

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

function parsePositiveInt(value: unknown, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return parsed
}

function parseOptionalString(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== "string") return undefined
  const trimmed = raw.trim()
  return trimmed || undefined
}

function parseOptionalObjectId(value: unknown, fieldName: string) {
  const parsed = parseOptionalString(value)
  if (!parsed) return undefined
  if (!mongoose.isValidObjectId(parsed)) {
    throw new AppError(`Invalid ${fieldName}`, 400)
  }
  return parsed
}
