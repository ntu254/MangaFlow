import type { NextFunction, Request, Response } from "express"
import {
  createTaskService,
  getTaskService,
  listTasksBySeriesService,
  listTasksByChapterService,
  listTasksByAssigneeService,
  listMyTasksService,
  updateTaskStatusService,
  updateTaskPriorityService,
  updateTaskDueDateService,
} from "../task.service.js"

export async function createTask(req: Request, res: Response, _next: NextFunction): Promise<void> {
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

  res.status(201).json({ success: true, message: "Task created successfully", data: result })
}

export async function getTask(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const task = await getTaskService(req.params.taskId as string, req.user!)
  res.json({ success: true, message: "Task retrieved successfully", data: task })
}

export async function listTasksBySeries(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const tasks = await listTasksBySeriesService(req.params.seriesId as string, req.user!, {
    status: req.query.status as string | undefined,
    assignedTo: req.query.assignedTo as string | undefined,
  })
  res.json({ success: true, message: "Tasks retrieved successfully", data: tasks })
}

export async function listTasksByChapter(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const tasks = await listTasksByChapterService(req.params.chapterId as string, req.user!)
  res.json({ success: true, message: "Tasks retrieved successfully", data: tasks })
}

export async function listTasksByAssignee(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const tasks = await listTasksByAssigneeService(req.params.assigneeId as string, req.user!)
  res.json({ success: true, message: "Tasks retrieved successfully", data: tasks })
}

export async function listMyTasks(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const tasks = await listMyTasksService(req.user!)
  res.json({ success: true, message: "Tasks retrieved successfully", data: tasks })
}

export async function updateTaskStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const task = await updateTaskStatusService(req.params.taskId as string, req.user!, req.body.status)
  res.json({ success: true, message: "Task status updated successfully", data: task })
}

export async function updateTaskPriority(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const task = await updateTaskPriorityService(req.params.taskId as string, req.user!, req.body.priority)
  res.json({ success: true, message: "Task priority updated successfully", data: task })
}

export async function updateTaskDueDate(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const task = await updateTaskDueDateService(req.params.taskId as string, req.user!, new Date(req.body.dueDate))
  res.json({ success: true, message: "Task due date updated successfully", data: task })
}
