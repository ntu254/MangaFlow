import type { Request, Response, NextFunction } from "express"
import type { UserRole } from "../../modules/auth/auth.types.js"

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Insufficient permissions" })
      return
    }

    next()
  }
}
