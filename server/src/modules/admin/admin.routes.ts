import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./admin.controller.js"
import {
  adminBoardMemberSchema,
  adminCreateTaskTypeSchema,
  adminCreateUserSchema,
  adminSetBoardChairSchema,
  adminTaskTypeIdParamsSchema,
  adminUpdateBoardMemberStatusSchema,
  adminUpdateTaskTypeSchema,
  adminUpdateTaskTypeStatusSchema,
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

router.get("/board-members", controller.listAdminBoardMembers)
router.post("/board-members", validate(adminBoardMemberSchema), controller.createAdminBoardMember)
router.patch("/board-members/:userId/status", validate(adminUserIdParamsSchema, "params"), validate(adminUpdateBoardMemberStatusSchema), controller.updateAdminBoardMemberStatus)
router.patch("/board-members/:userId/chair", validate(adminUserIdParamsSchema, "params"), validate(adminSetBoardChairSchema), controller.updateAdminBoardChair)

router.get("/task-types", controller.listAdminTaskTypes)
router.post("/task-types", validate(adminCreateTaskTypeSchema), controller.createAdminTaskType)
router.patch("/task-types/:taskTypeId", validate(adminTaskTypeIdParamsSchema, "params"), validate(adminUpdateTaskTypeSchema), controller.updateAdminTaskType)
router.patch("/task-types/:taskTypeId/status", validate(adminTaskTypeIdParamsSchema, "params"), validate(adminUpdateTaskTypeStatusSchema), controller.updateAdminTaskTypeStatus)
router.delete("/task-types/:taskTypeId", validate(adminTaskTypeIdParamsSchema, "params"), controller.deleteAdminTaskType)

export default router
