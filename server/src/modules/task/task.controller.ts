import type { NextFunction, Request, Response } from "express"
import {
  createTaskService,
  getTaskService,
  listTasksBySeriesService,
  listTasksByChapterService,
  listTasksByAssigneeService,
  updateTaskStatusService,
  updateTaskPriorityService,
  updateTaskDueDateService,
  createTaskTypeService,
  listTaskTypesService,
  getTaskTypeService,
  updateTaskTypeService,
  deleteTaskTypeService,
} from "./task.service.js"

export async function createTask(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const result = await createTaskService({
    seriesId: req.body.seriesId,
    chapterId: req.body.chapterId,
    pageId: req.body.pageId,
    regionId: req.body.regionId,
    taskTypeId: req.body.taskTypeId,
    assignedTo: req.body.assignedTo,
    assignedBy: req.user!.userId,
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    dueDate: new Date(req.body.dueDate),
    contextPageIds: req.body.contextPageIds,
  })

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: result,
  })
}

export async function getTask(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const task = await getTaskService((req.params.taskId as string), req.user!)

  res.json({
    success: true,
    message: "Task retrieved successfully",
    data: task,
  })
}

export async function listTasksBySeries(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const tasks = await listTasksBySeriesService(
    (req.params.seriesId as string),
    req.user!,
    {
      status: req.query.status as string | undefined,
      assignedTo: req.query.assignedTo as string | undefined,
    }
  )

  res.json({
    success: true,
    message: "Tasks retrieved successfully",
    data: tasks,
  })
}

export async function listTasksByChapter(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const tasks = await listTasksByChapterService((req.params.chapterId as string), req.user!)

  res.json({
    success: true,
    message: "Tasks retrieved successfully",
    data: tasks,
  })
}

export async function listTasksByAssignee(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const tasks = await listTasksByAssigneeService((req.params.assigneeId as string), req.user!)

  res.json({
    success: true,
    message: "Tasks retrieved successfully",
    data: tasks,
  })
}

export async function updateTaskStatus(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const task = await updateTaskStatusService((req.params.taskId as string), req.user!, req.body.status as any)

  res.json({
    success: true,
    message: "Task status updated successfully",
    data: task,
  })
}

export async function updateTaskPriority(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const task = await updateTaskPriorityService((req.params.taskId as string), req.user!, req.body.priority as any)

  res.json({
    success: true,
    message: "Task priority updated successfully",
    data: task,
  })
}

export async function updateTaskDueDate(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const task = await updateTaskDueDateService((req.params.taskId as string), req.user!, new Date(req.body.dueDate))

  res.json({
    success: true,
    message: "Task due date updated successfully",
    data: task,
  })
}

export async function createTaskType(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const result = await createTaskTypeService({
    name: req.body.name,
    description: req.body.description,
    baseRate: req.body.baseRate,
  })

  res.status(201).json({
    success: true,
    message: "Task type created successfully",
    data: result,
  })
}

export async function listTaskTypes(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const activeOnly = req.query.activeOnly !== "false"
  const taskTypes = await listTaskTypesService(activeOnly)

  res.json({
    success: true,
    message: "Task types retrieved successfully",
    data: taskTypes,
  })
}

export async function getTaskType(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const taskType = await getTaskTypeService((req.params.taskTypeId as string))

  res.json({
    success: true,
    message: "Task type retrieved successfully",
    data: taskType,
  })
}

export async function updateTaskType(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const taskType = await updateTaskTypeService((req.params.taskTypeId as string), {
    description: req.body.description,
    baseRate: req.body.baseRate,
    isActive: req.body.isActive,
  })

  res.json({
    success: true,
    message: "Task type updated successfully",
    data: taskType,
  })
}

export async function deleteTaskType(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  await deleteTaskTypeService((req.params.taskTypeId as string))

  res.json({
    success: true,
    message: "Task type deleted successfully",
    data: null,
  })
}
