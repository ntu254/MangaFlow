import type { Request, Response, NextFunction } from "express"
import { Chapter } from "../../modules/chapter/chapter.model.js"
import { requireSeriesRole } from "./requireSeriesRole.js"
import type { UserRole } from "../../modules/auth/auth.types.js"

/**
 * Series-scoped guard for routes that carry `:chapterId` instead of `:seriesId`.
 *
 * Resolves the chapter's seriesId, stashes it on req.params.seriesId so that
 * downstream requireSeriesRole sees a series id, then delegates the actual role check.
 *
 * Returns 404 if the chapter does not exist (mirrors the controller behavior),
 * 401/403 otherwise via requireSeriesRole.
 */
export function requireChapterRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" })
      return
    }

    const chapterId = req.params.chapterId
    if (!chapterId) {
      res.status(400).json({ success: false, message: "Chapter ID required for authorization" })
      return
    }

    const chapter = await Chapter.findById(chapterId).select("seriesId").lean()
    if (!chapter) {
      res.status(404).json({ success: false, message: "Chapter not found" })
      return
    }

    req.params.seriesId = String(chapter.seriesId)
    return requireSeriesRole(...allowedRoles)(req, res, next)
  }
}
