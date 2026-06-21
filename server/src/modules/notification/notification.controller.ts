import type { Request, Response } from "express"
import { Notification } from "../../shared/workflow/events.js"

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const notifications = await Notification.find({ userId: req.user!.userId, status: { $ne: "ARCHIVED" } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const total = await Notification.countDocuments({ userId: req.user!.userId, status: { $ne: "ARCHIVED" } })

  const mappedNotifs = notifications.map(n => ({
    _id: n._id,
    userId: n.userId,
    type: n.event,
    title: n.title,
    body: n.message,
    link: n.link,
    status: n.status ?? "UNREAD",
    createdAt: n.createdAt,
    updatedAt: n.updatedAt
  }))

  res.json({
    success: true,
    message: "Notifications retrieved",
    data: {
      notifications: mappedNotifs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  })
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, userId: req.user!.userId },
    { status: "READ" },
    { new: true }
  )

  if (!notification) {
    res.status(404).json({ success: false, message: "Notification not found" })
    return
  }

  res.json({ success: true, message: "Notification marked as read", data: { ...notification.toObject(), status: "READ" } })
}

export async function archiveNotification(req: Request, res: Response): Promise<void> {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, userId: req.user!.userId },
    { status: "ARCHIVED" },
    { new: true }
  )

  if (!notification) {
    res.status(404).json({ success: false, message: "Notification not found" })
    return
  }

  res.json({ success: true, message: "Notification archived", data: { ...notification.toObject(), status: "ARCHIVED" } })
}
