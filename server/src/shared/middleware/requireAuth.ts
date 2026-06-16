import type { Request, Response, NextFunction } from "express"
import { toAuthUser, verifyAccessToken } from "../../modules/auth/auth.service.js"
import type { JwtPayload } from "../../modules/auth/auth.types.js"

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication required" })
    return
  }

  const token = header.slice(7)
  try {
    const payload = await verifyAccessToken(token)
    const user = await toAuthUser(payload.userId)
    if (!user || user.role !== payload.role) {
      res.status(401).json({ success: false, message: "Inactive or invalid user" })
      return
    }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" })
  }
}
