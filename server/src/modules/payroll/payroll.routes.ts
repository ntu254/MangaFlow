import { Router, type Response } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { SERIES_MEMBER_ROLES, SYSTEM_ROLES } from "../../shared/constants/roles.js";
import { requireAuth, type AuthenticatedRequest, type AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, UserRepository } from "../auth/auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";
import type { TaskRepository } from "../task/task.repository.js";
import { createPayrollService, PayrollServiceError, type AssistantEarning } from "./payroll.service.js";
import type { PayrollRepository } from "./payroll.repository.js";

export type PayrollRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  taskRepository: TaskRepository;
  payrollRepository: PayrollRepository;
};

const payrollSeriesRoles = new Set<string>([SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA]);

function getClerkId(req: AuthenticatedRequest) {
  return req.auth!.clerkId;
}

async function resolveUser(dependencies: PayrollRouteDependencies, clerkId: string) {
  const user = await dependencies.userRepository.findByClerkId(clerkId);
  if (!user) {
    throw new PayrollServiceError("USER_NOT_SYNCED", "User not synced", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new PayrollServiceError("FORBIDDEN", "Account suspended", 403);
  }
  return user;
}

function assertAdmin(user: AuthUser) {
  if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
    throw new PayrollServiceError("FORBIDDEN", "Admin role required", 403);
  }
}

async function assertSeriesPayrollAccess(dependencies: PayrollRouteDependencies, user: AuthUser, seriesId: string) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return;
  if (user.systemRole !== SYSTEM_ROLES.MANGAKA) {
    throw new PayrollServiceError("FORBIDDEN", "Mangaka or Admin role required", 403);
  }
  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!payrollSeriesRoles.has(role ?? "")) {
    throw new PayrollServiceError("FORBIDDEN", "Insufficient series payroll role", 403);
  }
}

async function assertTaskPayrollAccess(dependencies: PayrollRouteDependencies, user: AuthUser, taskId: string) {
  const task = await dependencies.taskRepository.findById(taskId);
  if (!task) {
    throw new PayrollServiceError("TASK_NOT_FOUND", "Task not found", 404);
  }
  await assertSeriesPayrollAccess(dependencies, user, task.seriesId);
  return task;
}

async function filterAssistantEarningsForMangaka(
  dependencies: PayrollRouteDependencies,
  user: AuthUser,
  earnings: AssistantEarning[]
) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return earnings;
  const visible: AssistantEarning[] = [];
  for (const earning of earnings) {
    try {
      await assertSeriesPayrollAccess(dependencies, user, earning.seriesId);
      visible.push(earning);
    } catch {
      // Hide earnings outside the user's series scope.
    }
  }
  return visible;
}

function sendPayrollError(res: Response, error: unknown) {
  if (error instanceof PayrollServiceError) {
    res.status(error.statusCode).json(fail(error.message, error.code));
    return;
  }
  res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
}

export function createPayrollRouter(dependencies: PayrollRouteDependencies) {
  const router = Router({ mergeParams: true });
  const authenticate = requireAuth(dependencies.authVerifier);
  const service = createPayrollService(dependencies.payrollRepository, dependencies.taskRepository, dependencies.seriesRepository);

  router.get("/task-rates", authenticate, async (_req, res) => {
    try {
      res.json(ok(await service.listTaskRates()));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.post("/task-rates", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      assertAdmin(user);
      const rate = await service.createTaskRate(req.body);
      res.status(201).json(ok(rate));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.get("/task-rates/:taskRateId", authenticate, async (req, res) => {
    try {
      res.json(ok(await service.getTaskRate(req.params.taskRateId as string)));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.patch("/task-rates/:taskRateId", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      assertAdmin(user);
      res.json(ok(await service.updateTaskRate(req.params.taskRateId as string, req.body)));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.delete("/task-rates/:taskRateId", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      assertAdmin(user);
      res.json(ok(await service.deactivateTaskRate(req.params.taskRateId as string)));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.get("/payroll/me", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      res.json(ok(await service.listEarningsForAssistant(user.id)));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.get("/payroll", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      assertAdmin(user);
      res.json(ok(await service.listEarnings()));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.get("/payroll/series/:seriesId", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const seriesId = req.params.seriesId as string;
      await assertSeriesPayrollAccess(dependencies, user, seriesId);
      res.json(ok(await service.listEarningsForSeries(seriesId)));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.get("/payroll/assistants/:assistantId", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const assistantId = req.params.assistantId as string;
      const earnings = await service.listEarningsForAssistant(assistantId);
      if (user.systemRole !== SYSTEM_ROLES.ADMIN && user.id !== assistantId) {
        res.json(ok(await filterAssistantEarningsForMangaka(dependencies, user, earnings)));
        return;
      }
      res.json(ok(earnings));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.get("/payroll/monthly", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      if (![SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.MANGAKA].includes(user.systemRole as any)) {
        throw new PayrollServiceError("FORBIDDEN", "Mangaka or Admin role required", 403);
      }
      res.json(ok(await service.getMonthlySummary()));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.post("/payroll/tasks/:taskId/calculate", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertTaskPayrollAccess(dependencies, user, req.params.taskId as string);
      res.status(201).json(ok(await service.calculateTaskEarning(req.params.taskId as string)));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.post("/payroll/tasks/:taskId/confirm", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertTaskPayrollAccess(dependencies, user, req.params.taskId as string);
      res.json(ok(await service.confirmTaskEarning(req.params.taskId as string)));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  router.post("/payroll/:earningId/mark-paid", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      assertAdmin(user);
      res.json(ok(await service.markPaid(req.params.earningId as string)));
    } catch (error) {
      sendPayrollError(res, error);
    }
  });

  return router;
}
