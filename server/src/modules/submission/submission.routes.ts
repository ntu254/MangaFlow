import { Router, type Response } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { SYSTEM_ROLES } from "../../shared/constants/roles.js";
import { requireAuth, type AuthenticatedRequest, type AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, UserRepository } from "../auth/auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";
import type { TaskRepository } from "../task/task.repository.js";
import type { Task } from "../task/task.service.js";
import { createSubmissionService, SubmissionServiceError, type Submission } from "./submission.service.js";
import type { SubmissionRepository } from "./submission.repository.js";

export type SubmissionRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  taskRepository: TaskRepository;
  submissionRepository: SubmissionRepository;
};

function getClerkId(req: AuthenticatedRequest) {
  return req.auth!.clerkId;
}

async function resolveUser(dependencies: SubmissionRouteDependencies, clerkId: string) {
  const user = await dependencies.userRepository.findByClerkId(clerkId);
  if (!user) {
    throw new SubmissionServiceError("USER_NOT_SYNCED", "User not synced", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new SubmissionServiceError("FORBIDDEN", "Account suspended", 403);
  }
  return user;
}

async function getTaskOrThrow(dependencies: SubmissionRouteDependencies, taskId: string) {
  const task = await dependencies.taskRepository.findById(taskId);
  if (!task) {
    throw new SubmissionServiceError("TASK_NOT_FOUND", "Task not found", 404);
  }
  return task;
}

async function assertReadAccess(dependencies: SubmissionRouteDependencies, user: AuthUser, task: Task) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return;
  if (task.assignedTo === user.id || task.assignedBy === user.id) return;
  const role = await dependencies.seriesRepository.getSeriesMemberRole(task.seriesId, user.id);
  if (!role) {
    throw new SubmissionServiceError("FORBIDDEN", "Insufficient series role", 403);
  }
}

async function assertCreateAccess(dependencies: SubmissionRouteDependencies, user: AuthUser, task: Task) {
  if (user.systemRole !== SYSTEM_ROLES.ASSISTANT) {
    throw new SubmissionServiceError("FORBIDDEN", "Only Assistants can submit tasks", 403);
  }
  if (task.assignedTo !== user.id) {
    throw new SubmissionServiceError("FORBIDDEN", "Only the assigned assistant can submit this task", 403);
  }
  const role = await dependencies.seriesRepository.getSeriesMemberRole(task.seriesId, user.id);
  if (!role) {
    throw new SubmissionServiceError("FORBIDDEN", "Assigned assistant must belong to the series", 403);
  }
}

async function filterReadableSubmissions(
  dependencies: SubmissionRouteDependencies,
  user: AuthUser,
  submissions: Submission[]
) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return submissions;
  const visible: Submission[] = [];
  for (const submission of submissions) {
    const task = await dependencies.taskRepository.findById(submission.taskId);
    if (!task) continue;
    try {
      await assertReadAccess(dependencies, user, task);
      visible.push(submission);
    } catch {
      // Omit records outside the user's scope from list responses.
    }
  }
  return visible;
}

function sendSubmissionError(res: Response, error: unknown) {
  if (error instanceof SubmissionServiceError) {
    res.status(error.statusCode).json(fail(error.message, error.code));
    return;
  }
  res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
}

export function createSubmissionRouter(dependencies: SubmissionRouteDependencies) {
  const router = Router({ mergeParams: true });
  const authenticate = requireAuth(dependencies.authVerifier);
  const service = createSubmissionService(dependencies.submissionRepository, dependencies.taskRepository);

  router.get("/submissions", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      if (user.systemRole === SYSTEM_ROLES.ADMIN) {
        res.json(ok(await service.listAll()));
        return;
      }
      if (user.systemRole === SYSTEM_ROLES.ASSISTANT) {
        res.json(ok(await service.listForSubmitter(user.id)));
        return;
      }
      const submissions = await service.listAll();
      res.json(ok(await filterReadableSubmissions(dependencies, user, submissions)));
    } catch (error) {
      sendSubmissionError(res, error);
    }
  });

  router.get("/tasks/:taskId/submissions", authenticate, async (req, res) => {
    try {
      const task = await getTaskOrThrow(dependencies, req.params.taskId as string);
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertReadAccess(dependencies, user, task);
      res.json(ok(await service.listForTask(task.id)));
    } catch (error) {
      sendSubmissionError(res, error);
    }
  });

  router.post("/tasks/:taskId/submissions", authenticate, async (req, res) => {
    try {
      const task = await getTaskOrThrow(dependencies, req.params.taskId as string);
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertCreateAccess(dependencies, user, task);
      const submission = await service.createSubmission({
        taskId: task.id,
        submittedBy: user.id,
        fileUrl: req.body.fileUrl,
        previewUrl: req.body.previewUrl,
        note: req.body.note
      });
      res.status(201).json(ok(submission));
    } catch (error) {
      sendSubmissionError(res, error);
    }
  });

  router.get("/submissions/:submissionId", authenticate, async (req, res) => {
    try {
      const submission = await service.getById(req.params.submissionId as string);
      const task = await getTaskOrThrow(dependencies, submission.taskId);
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertReadAccess(dependencies, user, task);
      res.json(ok(submission));
    } catch (error) {
      sendSubmissionError(res, error);
    }
  });

  return router;
}
