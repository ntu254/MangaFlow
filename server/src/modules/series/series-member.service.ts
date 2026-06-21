import { AppError } from "../../shared/errors/AppError.js"
import { Series, SeriesMember } from "./series.model.js"
import { User } from "../auth/auth.model.js"
import { recordAuditLog } from "../../shared/workflow/events.js"
import { Task } from "../task/task.model.js"

// ---------------------------------------------------------------------------
// Add member (Flow-03)
// ---------------------------------------------------------------------------
export async function addSeriesMemberService(input: {
  seriesId: string
  userId?: string
  email?: string
  role: "ASSISTANT" | "CO_MANGAKA" | "EDITOR"
  accessScope: "FULL" | "TASK_ONLY"
  actorId: string
}) {
  const series = await Series.findById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)

  // Only the series owner Mangaka can manage the team
  if (series.ownerId.toString() !== input.actorId) {
    throw new AppError("Only the series owner can add members", 403)
  }

  // Series must be in a production-eligible state
  const productionStatuses = ["ONGOING", "AT_RISK"]
  if (!productionStatuses.includes(series.status)) {
    throw new AppError("Cannot add members to a series that is not in production", 409)
  }

  const normalizedEmail = input.email?.trim().toLowerCase()
  const user = input.userId
    ? await User.findById(input.userId)
    : normalizedEmail
      ? await User.findOne({ email: normalizedEmail })
      : null
  if (!user) throw new AppError("User not found. Create an assistant account before inviting by email.", 404)
  if (!user.isActive) throw new AppError("User is not active", 400)

  // Enforce system role matches series role for ASSISTANT
  if (input.role === "ASSISTANT" && user.role !== "ASSISTANT") {
    throw new AppError("User does not have the ASSISTANT system role", 400)
  }

  const existingMember = await SeriesMember.findOne({
    seriesId: input.seriesId,
    userId: user._id,
  })

  if (existingMember) {
    // Re-activate if previously removed/paused
    if (existingMember.status === "ACTIVE") {
      throw new AppError("User is already an active member of this series", 409)
    }
    existingMember.status = input.email ? "INVITED" : "ACTIVE"
    existingMember.isActive = existingMember.status === "ACTIVE"
    existingMember.role = input.role as any
    existingMember.accessScope = input.accessScope
    await existingMember.save()

    void recordAuditLog({
      event: "SERIES_MEMBER_REACTIVATED",
      actorId: input.actorId,
      entityType: "SeriesMember",
      entityId: String(existingMember._id),
      metadata: { seriesId: input.seriesId, userId: String(user._id), email: user.email },
    }).catch(() => undefined)

    return existingMember
  }

  const member = await SeriesMember.create({
    seriesId: input.seriesId,
    userId: user._id,
    role: input.role,
    status: input.email ? "INVITED" : "ACTIVE",
    isActive: !input.email,
    accessScope: input.accessScope,
  })

  void recordAuditLog({
    event: "SERIES_MEMBER_ADDED",
    actorId: input.actorId,
    entityType: "SeriesMember",
    entityId: String(member._id),
    metadata: { seriesId: input.seriesId, userId: String(user._id), email: user.email, role: input.role },
  }).catch(() => undefined)

  return member
}

// ---------------------------------------------------------------------------
// List members (Flow-03)
// ---------------------------------------------------------------------------
export async function listSeriesMembersService(seriesId: string, actorId: string, actorRole: string) {
  const series = await Series.findById(seriesId)
  if (!series) throw new AppError("Series not found", 404)

  // MANGAKA, EDITOR, ADMIN can view
  if (actorRole === "ADMIN") {
    return SeriesMember.find({ seriesId }).populate("userId", "name displayName email role").lean()
  }

  // Check if actor is a member
  const actorMember = await SeriesMember.findOne({ seriesId, userId: actorId })
  if (!actorMember && series.ownerId.toString() !== actorId) {
    throw new AppError("Access denied", 403)
  }

  return SeriesMember.find({ seriesId }).populate("userId", "name displayName email role").lean()
}

export async function listMySeriesMembershipsService(actorId: string, actorRole: string) {
  if (actorRole !== "ASSISTANT") {
    throw new AppError("Only assistants can list their series memberships", 403)
  }

  return SeriesMember.find({
    userId: actorId,
    role: "ASSISTANT",
    status: { $in: ["INVITED", "ACTIVE", "PAUSED"] },
  })
    .sort({ updatedAt: -1 })
    .populate("seriesId", "title slug synopsis status publicationType genres tags")
    .populate("userId", "name displayName email role")
    .lean()
}

// ---------------------------------------------------------------------------
// Update member status (pause / reactivate) (Flow-03)
// ---------------------------------------------------------------------------
export async function updateSeriesMemberService(input: {
  seriesId: string
  memberId: string
  status: "ACTIVE" | "PAUSED"
  actorId: string
}) {
  const series = await Series.findById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)

  if (series.ownerId.toString() !== input.actorId) {
    throw new AppError("Only the series owner can manage members", 403)
  }

  const member = await SeriesMember.findOne({ _id: input.memberId, seriesId: input.seriesId })
  if (!member) throw new AppError("Member not found", 404)
  if (member.status === "REMOVED") throw new AppError("Cannot update a removed member", 409)

  const prevStatus = member.status
  member.status = input.status
  member.isActive = input.status === "ACTIVE"
  await member.save()

  const event = input.status === "PAUSED" ? "SERIES_MEMBER_PAUSED" : "SERIES_MEMBER_REACTIVATED"
  void recordAuditLog({
    event,
    actorId: input.actorId,
    entityType: "SeriesMember",
    entityId: String(member._id),
    metadata: { seriesId: input.seriesId, prevStatus, newStatus: input.status },
  }).catch(() => undefined)

  return member
}

// ---------------------------------------------------------------------------
// Accept invite (Flow-03)
// ---------------------------------------------------------------------------
export async function acceptSeriesMemberInviteService(input: {
  seriesId: string
  memberId?: string
  actorId: string
}) {
  const series = await Series.findById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)

  const member = await SeriesMember.findOne({
    ...(input.memberId ? { _id: input.memberId } : { userId: input.actorId }),
    seriesId: input.seriesId,
  })
  if (!member) throw new AppError("Member invite not found", 404)
  if (String(member.userId) !== input.actorId) {
    throw new AppError("Only the invited assistant can accept this invite", 403)
  }
  if (member.role !== "ASSISTANT") {
    throw new AppError("Only assistant invites can be accepted through this endpoint", 400)
  }
  if (member.status === "ACTIVE") {
    return member
  }
  if (member.status !== "INVITED") {
    throw new AppError(`Cannot accept invite with status ${member.status}`, 409)
  }

  member.status = "ACTIVE"
  member.isActive = true
  await member.save()

  void recordAuditLog({
    event: "SERIES_MEMBER_INVITE_ACCEPTED",
    actorId: input.actorId,
    entityType: "SeriesMember",
    entityId: String(member._id),
    metadata: { seriesId: input.seriesId, userId: String(member.userId) },
  }).catch(() => undefined)

  return member
}

// ---------------------------------------------------------------------------
// Remove member (Flow-03)
// ---------------------------------------------------------------------------
export async function removeSeriesMemberService(input: {
  seriesId: string
  memberId: string
  actorId: string
}) {
  const series = await Series.findById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)

  if (series.ownerId.toString() !== input.actorId) {
    throw new AppError("Only the series owner can remove members", 403)
  }

  const member = await SeriesMember.findOne({ _id: input.memberId, seriesId: input.seriesId })
  if (!member) throw new AppError("Member not found", 404)

  // Block removal if assistant has active tasks in this series
  const activeTask = await Task.findOne({
    seriesId: input.seriesId,
    assignedTo: member.userId,
    status: { $in: ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"] },
  })
  if (activeTask) {
    throw new AppError("Cannot remove member with active tasks. Reassign or cancel tasks first.", 409)
  }

  member.status = "REMOVED"
  member.isActive = false
  await member.save()

  void recordAuditLog({
    event: "SERIES_MEMBER_REMOVED",
    actorId: input.actorId,
    entityType: "SeriesMember",
    entityId: String(member._id),
    metadata: { seriesId: input.seriesId, userId: String(member.userId) },
  }).catch(() => undefined)

  return member
}

// ---------------------------------------------------------------------------
// Eligible assistants (Flow-03)
// ---------------------------------------------------------------------------
export async function getEligibleAssistantsService(seriesId: string, actorId: string, actorRole: string) {
  const series = await Series.findById(seriesId)
  if (!series) throw new AppError("Series not found", 404)

  // Only owner, editor, admin can check
  if (actorRole !== "ADMIN" && actorRole !== "EDITOR") {
    if (series.ownerId.toString() !== actorId) {
      throw new AppError("Access denied", 403)
    }
  }

  const activeMembers = await SeriesMember.find({
    seriesId,
    role: "ASSISTANT",
    status: "ACTIVE",
  }).populate<{ userId: { _id: any; name: string; displayName?: string; email: string; role: string; isActive: boolean } }>(
    "userId",
    "name displayName email role isActive",
  )

  // Extra guard: only return assistants whose user account is still active
  return activeMembers
    .filter((m) => m.userId && m.userId.isActive)
    .map((m) => ({
      memberId: String(m._id),
      user: {
        id: String(m.userId._id),
        name: m.userId.displayName || m.userId.name,
        email: m.userId.email,
        role: m.userId.role,
      },
      accessScope: m.accessScope,
    }))
}
