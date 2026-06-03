import { Router, type Response } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { SERIES_MEMBER_ROLES, SYSTEM_ROLES } from "../../shared/constants/roles.js";
import { requireAuth, type AuthenticatedRequest, type AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, UserRepository } from "../auth/auth.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { PageRepository } from "../page/page.repository.js";
import type { RegionRepository } from "../region/region.repository.js";
import type { RegionType } from "../region/region.model.js";
import type { SeriesRepository } from "../series/series.service.js";
import { createTaskService, TaskServiceError, type CreateTaskInput, type Task, type UpdateTaskInput } from "./task.service.js";
import type { TaskRepository } from "./task.repository.js";
import type { TaskType } from "./task.model.js";

export type TaskRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  chapterRepository: ChapterRepository;
  pageRepository: PageRepository;
  regionRepository: RegionRepository;
  taskRepository: TaskRepository;
};

const createSeriesRoles = [
  SERIES_MEMBER_ROLES.OWNER_MANGAKA,
  SERIES_MEMBER_ROLES.CO_MANGAKA,
  SERIES_MEMBER_ROLES.EDITOR
] as const;

const taskTypes = new Set<TaskType>(["BACKGROUND", "INKING", "SCREENTONE", "CLEANUP", "EFFECT", "OTHER"]);

function getClerkId(req: AuthenticatedRequest) {
  return req.auth!.clerkId;
}

function toNumberOrUndefined(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "number" ? value : Number(value);
}

function mapRegionTypeToTaskType(type: RegionType): TaskType {
  return type === "BUBBLE" ? "OTHER" : type;
}

async function resolveUser(dependencies: TaskRouteDependencies, clerkId: string) {
  const user = await dependencies.userRepository.findByClerkId(clerkId);
  if (!user) {
    throw new TaskServiceError("USER_NOT_SYNCED", "User not synced", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new TaskServiceError("FORBIDDEN", "Account suspended", 403);
  }
  return user;
}

async function resolvePageScope(dependencies: TaskRouteDependencies, pageId: string) {
  const page = await dependencies.pageRepository.findById(pageId);
  if (!page) return null;
  const chapter = await dependencies.chapterRepository.findById(page.chapterId);
  if (!chapter) return null;
  return { page, chapter };
}

async function resolveTaskScope(dependencies: TaskRouteDependencies, task: Pick<Task, "pageId">) {
  return resolvePageScope(dependencies, task.pageId);
}

async function assertCreateAccess(dependencies: TaskRouteDependencies, user: AuthUser, seriesId: string) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return;
  if (![SYSTEM_ROLES.MANGAKA, SYSTEM_ROLES.EDITOR].includes(user.systemRole as any)) {
    throw new TaskServiceError("FORBIDDEN", "Insufficient system role", 403);
  }
  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!role || !createSeriesRoles.includes(role as any)) {
    throw new TaskServiceError("FORBIDDEN", "Insufficient series role", 403);
  }
}

async function assertReadAccess(dependencies: TaskRouteDependencies, user: AuthUser, task: Task, seriesId: string) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return;
  if (task.assignedTo === user.id || task.assignedBy === user.id) return;
  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!role) {
    throw new TaskServiceError("FORBIDDEN", "Insufficient series role", 403);
  }
}

async function assertUpdateAccess(dependencies: TaskRouteDependencies, user: AuthUser, seriesId: string) {
  return assertCreateAccess(dependencies, user, seriesId);
}

async function assertDeleteAccess(dependencies: TaskRouteDependencies, user: AuthUser, seriesId: string) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return;
  if (user.systemRole !== SYSTEM_ROLES.MANGAKA) {
    throw new TaskServiceError("FORBIDDEN", "Only Mangaka or Admin can delete tasks", 403);
  }
  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (![SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA].includes(role as any)) {
    throw new TaskServiceError("FORBIDDEN", "Insufficient series role", 403);
  }
}

async function assertAssistantAssignee(dependencies: TaskRouteDependencies, assignedTo: string, seriesId: string) {
  if (!dependencies.userRepository.findById) return;
  const user = await dependencies.userRepository.findById(assignedTo);
  if (!user) {
    throw new TaskServiceError("ASSIGNEE_NOT_FOUND", "Assigned assistant not found", 404);
  }
  if (user.status !== "ACTIVE" || user.systemRole !== SYSTEM_ROLES.ASSISTANT) {
    throw new TaskServiceError("INVALID_ASSIGNEE", "Task must be assigned to an active Assistant");
  }
  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!role) {
    throw new TaskServiceError("INVALID_ASSIGNEE", "Assigned assistant must belong to the series");
  }
}

async function resolveCreateScope(dependencies: TaskRouteDependencies, input: { pageId?: string; regionId?: string }) {
  let pageId = input.pageId;
  if (input.regionId) {
    const region = await dependencies.regionRepository.findById(input.regionId);
    if (!region) {
      throw new TaskServiceError("REGION_NOT_FOUND", "Region not found", 404);
    }
    if (pageId && region.pageId !== pageId) {
      throw new TaskServiceError("REGION_PAGE_MISMATCH", "Region does not belong to this page");
    }
    pageId = region.pageId;
  }
  if (!pageId) {
    throw new TaskServiceError("INVALID_PAGE", "Page id is required");
  }
  const scope = await resolvePageScope(dependencies, pageId);
  if (!scope) {
    throw new TaskServiceError("PAGE_NOT_FOUND", "Page not found", 404);
  }
  return scope;
}

async function listTasksForUser(dependencies: TaskRouteDependencies, service: ReturnType<typeof createTaskService>, user: AuthUser) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return service.listAll();
  if (user.systemRole === SYSTEM_ROLES.ASSISTANT) return service.listForAssistant(user.id);
  const series = await dependencies.seriesRepository.listSeriesForUser(user.id);
  return service.listForSeries(series.map((item) => item.id));
}

function buildCreateTaskInput(
  user: AuthUser,
  scope: Awaited<ReturnType<typeof resolvePageScope>> extends infer S ? NonNullable<S> : never,
  body: any,
  regionId?: string,
  defaultType?: TaskType
): CreateTaskInput {
  const requestedType = body.type as TaskType | undefined;
  const type = requestedType && taskTypes.has(requestedType) ? requestedType : defaultType;
  if (!type) {
    throw new TaskServiceError("INVALID_TASK_TYPE", "Task type is required");
  }
  return {
    seriesId: scope.chapter.seriesId,
    chapterId: scope.chapter.id,
    pageId: scope.page.id,
    regionId,
    assignedBy: user.id,
    assignedTo: body.assignedTo,
    title: body.title,
    description: body.description,
    type,
    priority: body.priority,
    baseRate: toNumberOrUndefined(body.baseRate),
    bonusAmount: toNumberOrUndefined(body.bonusAmount),
    dueDate: body.dueDate
  };
}

function sendTaskError(res: Response, error: unknown) {
  if (error instanceof TaskServiceError) {
    res.status(error.statusCode).json(fail(error.message, error.code));
    return;
  }
  res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
}

export function createTaskRouter(dependencies: TaskRouteDependencies) {
  const router = Router({ mergeParams: true });
  const authenticate = requireAuth(dependencies.authVerifier);
  const service = createTaskService(dependencies.taskRepository);

  router.get("/tasks", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const tasks = await listTasksForUser(dependencies, service, user);
      res.json(ok(tasks));
    } catch (error) {
      sendTaskError(res, error);
    }
  });

  router.post("/tasks", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const scope = await resolveCreateScope(dependencies, { pageId: req.body.pageId, regionId: req.body.regionId });
      await assertCreateAccess(dependencies, user, scope.chapter.seriesId);
      await assertAssistantAssignee(dependencies, req.body.assignedTo, scope.chapter.seriesId);
      const task = await service.createTask(buildCreateTaskInput(user, scope, req.body, req.body.regionId));
      res.status(201).json(ok(task));
    } catch (error) {
      sendTaskError(res, error);
    }
  });

  router.post("/regions/:regionId/create-task", authenticate, async (req, res) => {
    try {
      const region = await dependencies.regionRepository.findById(req.params.regionId as string);
      if (!region) {
        res.status(404).json(fail("Region not found", "REGION_NOT_FOUND"));
        return;
      }
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const scope = await resolveCreateScope(dependencies, { pageId: region.pageId, regionId: region.id });
      await assertCreateAccess(dependencies, user, scope.chapter.seriesId);
      await assertAssistantAssignee(dependencies, req.body.assignedTo, scope.chapter.seriesId);
      const task = await service.createTask(
        buildCreateTaskInput(user, scope, req.body, region.id, mapRegionTypeToTaskType(region.type))
      );
      res.status(201).json(ok(task));
    } catch (error) {
      sendTaskError(res, error);
    }
  });

  router.get("/tasks/:taskId", authenticate, async (req, res) => {
    try {
      const task = await service.getById(req.params.taskId as string);
      const scope = await resolveTaskScope(dependencies, task);
      if (!scope) {
        res.status(404).json(fail("Page not found", "PAGE_NOT_FOUND"));
        return;
      }
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertReadAccess(dependencies, user, task, scope.chapter.seriesId);
      res.json(ok(task));
    } catch (error) {
      sendTaskError(res, error);
    }
  });

  router.patch("/tasks/:taskId", authenticate, async (req, res) => {
    try {
      const current = await service.getById(req.params.taskId as string);
      const scope = await resolveTaskScope(dependencies, current);
      if (!scope) {
        res.status(404).json(fail("Page not found", "PAGE_NOT_FOUND"));
        return;
      }
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertUpdateAccess(dependencies, user, scope.chapter.seriesId);
      if (req.body.assignedTo !== undefined) {
        await assertAssistantAssignee(dependencies, req.body.assignedTo, scope.chapter.seriesId);
      }
      const update: UpdateTaskInput = {
        assignedTo: req.body.assignedTo,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        priority: req.body.priority,
        baseRate: toNumberOrUndefined(req.body.baseRate),
        bonusAmount: toNumberOrUndefined(req.body.bonusAmount),
        dueDate: req.body.dueDate,
        status: req.body.status
      };
      const updated = await service.updateTask(current.id, update);
      res.json(ok(updated));
    } catch (error) {
      sendTaskError(res, error);
    }
  });

  router.delete("/tasks/:taskId", authenticate, async (req, res) => {
    try {
      const current = await service.getById(req.params.taskId as string);
      const scope = await resolveTaskScope(dependencies, current);
      if (!scope) {
        res.status(404).json(fail("Page not found", "PAGE_NOT_FOUND"));
        return;
      }
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertDeleteAccess(dependencies, user, scope.chapter.seriesId);
      const deleted = await service.deleteTask(current.id);
      res.json(ok({ deleted }));
    } catch (error) {
      sendTaskError(res, error);
    }
  });

  router.post("/tasks/:taskId/start", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      if (user.systemRole !== SYSTEM_ROLES.ASSISTANT) {
        throw new TaskServiceError("FORBIDDEN", "Only Assistants can start tasks", 403);
      }
      const task = await service.startTask(req.params.taskId as string, user.id);
      res.json(ok(task));
    } catch (error) {
      sendTaskError(res, error);
    }
  });

  return router;
}
