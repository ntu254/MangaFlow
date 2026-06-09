import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./admin.controller.js"
import {
  adminCreateUserSchema,
  adminUpdateUserRoleSchema,
  adminUpdateUserStatusSchema,
  adminUserIdParamsSchema,
} from "./admin.validation.js"

const router = Router()

router.use(requireAuth, requireRole("ADMIN"))
router.get("/users", controller.listAdminUsers)
router.post("/users", validate(adminCreateUserSchema), controller.createAdminUser)
router.patch("/users/:userId/role", validate(adminUserIdParamsSchema, "params"), validate(adminUpdateUserRoleSchema), controller.updateAdminUserRole)
router.patch("/users/:userId/status", validate(adminUserIdParamsSchema, "params"), validate(adminUpdateUserStatusSchema), controller.updateAdminUserStatus)

export default router
