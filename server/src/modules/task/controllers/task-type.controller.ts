import type { NextFunction, Request, Response } from "express"
import {
  createTaskTypeService,
  listTaskTypesService,
  getTaskTypeService,
  updateTaskTypeService,
  deleteTaskTypeService,
} from "../task.service.js"
import type { TaskTypeInput, TaskTypeUpdateInput } from "../task-type.types.js"

export async function createTaskType(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const result = await createTaskTypeService(req.body as TaskTypeInput)
  res.status(201).json({ success: true, message: "Task type created successfully", data: result })
}

export async function listTaskTypes(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const taskTypes = await listTaskTypesService(req.query.activeOnly !== "false")
  res.json({ success: true, message: "Task types retrieved successfully", data: taskTypes })
}

export async function getTaskType(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const taskType = await getTaskTypeService(req.params.taskTypeId as string)
  res.json({ success: true, message: "Task type retrieved successfully", data: taskType })
}

export async function updateTaskType(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const taskType = await updateTaskTypeService(req.params.taskTypeId as string, req.body as TaskTypeUpdateInput)
  res.json({ success: true, message: "Task type updated successfully", data: taskType })
}

export async function deleteTaskType(req: Request, res: Response, _next: NextFunction): Promise<void> {
  await deleteTaskTypeService(req.params.taskTypeId as string)
  res.json({ success: true, message: "Task type deleted successfully", data: null })
}
