import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { validate } from "../../shared/middleware/validate.js"
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.validation.js"
import * as controller from "./auth.controller.js"

const router = Router()

router.post("/register", validate(registerSchema), controller.register)
router.post("/login", validate(loginSchema), controller.login)
router.post("/logout", controller.logout)
router.post("/refresh-token", validate(refreshTokenSchema), controller.refreshToken)
router.get("/me", requireAuth, controller.me)

export default router
