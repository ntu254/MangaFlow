import { Router } from "express"
import rateLimit from "express-rate-limit"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import { loginSchema, refreshTokenSchema, createUserSchema } from "./auth.validation.js"
import * as controller from "./auth.controller.js"

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later." },
})

router.post("/login", loginLimiter, validate(loginSchema), controller.login)
router.post("/logout", controller.logout)
router.post("/refresh-token", validate(refreshTokenSchema), controller.refreshToken)
router.get("/me", requireAuth, controller.me)

router.post("/admin/users", requireAuth, requireRole("ADMIN"), validate(createUserSchema), controller.adminCreateUser)

export default router
