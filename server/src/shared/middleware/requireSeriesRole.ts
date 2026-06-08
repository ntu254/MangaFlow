import type { Request, Response, NextFunction } from "express"
import { SeriesMember } from "../../modules/series/series.model.js"
import type { UserRole } from "../../modules/auth/auth.types.js"

interface SeriesRoleCheck {
  seriesId: string
  userId: string
  allowedRoles: UserRole[]
  requireActive?: boolean
}

export async function checkSeriesRole({ seriesId, userId, allowedRoles, requireActive = true }: SeriesRoleCheck): Promise<boolean> {
  const member = await SeriesMember.findOne({ seriesId, userId })
  if (!member) return false
  if (!allowedRoles.includes(member.role as UserRole)) return false
  if (requireActive && !member.isActive) return false
  return true
}

export function requireSeriesRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" })
      return
    }

    const seriesId = req.params.seriesId || req.body.seriesId || req.query.seriesId
    if (!seriesId) {
      res.status(400).json({ success: false, message: "Series ID required for authorization" })
      return
    }

    const hasRole = await checkSeriesRole({
      seriesId: String(seriesId),
      userId: req.user.userId,
      allowedRoles,
    })

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required series role: ${allowedRoles.join(" or ")}`,
      })
      return
    }

    next()
  }
}

export function requireAssistantSeriesMember() {
  return requireSeriesRole("ASSISTANT")
}

export function requireMangakaOrEditorSeriesMember() {
  return requireSeriesRole("MANGAKA", "EDITOR")
}

export function requireAnySeriesMember() {
  return requireSeriesRole("MANGAKA", "ASSISTANT", "EDITOR")
}