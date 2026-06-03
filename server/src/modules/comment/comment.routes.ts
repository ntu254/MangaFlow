import { Router, type Response } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { SYSTEM_ROLES, SERIES_MEMBER_ROLES } from "../../shared/constants/roles.js";
import { requireAuth, type AuthenticatedRequest, type AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, UserRepository } from "../auth/auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";
import type { ManuscriptRepository } from "../manuscript/manuscript.repository.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { PageRepository } from "../page/page.repository.js";
import type { TaskRepository } from "../task/task.repository.js";
import type { SubmissionRepository } from "../submission/submission.repository.js";
import { createCommentService, CommentServiceError, type Comment } from "./comment.service.js";
import type { CommentRepository } from "./comment.repository.js";
import type { CommentTargetType } from "./comment.model.js";

export type CommentRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  manuscriptRepository: ManuscriptRepository;
  chapterRepository: ChapterRepository;
  pageRepository: PageRepository;
  taskRepository: TaskRepository;
  submissionRepository: SubmissionRepository;
  commentRepository: CommentRepository;
};

function getClerkId(req: AuthenticatedRequest) {
  return req.auth!.clerkId;
}

async function resolveUser(dependencies: CommentRouteDependencies, clerkId: string) {
  const user = await dependencies.userRepository.findByClerkId(clerkId);
  if (!user) {
    throw new CommentServiceError("USER_NOT_SYNCED", "User not synced", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new CommentServiceError("FORBIDDEN", "Account suspended", 403);
  }
  return user;
}

async function getSeriesIdForTarget(
  dependencies: CommentRouteDependencies,
  targetType: string,
  targetId: string
): Promise<string | null> {
  if (targetType === "MANUSCRIPT") {
    const manuscript = await dependencies.manuscriptRepository.findById(targetId);
    return manuscript ? manuscript.seriesId : null;
  }
  if (targetType === "CHAPTER") {
    const chapter = await dependencies.chapterRepository.findById(targetId);
    return chapter ? chapter.seriesId : null;
  }
  if (targetType === "PAGE") {
    const page = await dependencies.pageRepository.findById(targetId);
    if (!page) return null;
    const chapter = await dependencies.chapterRepository.findById(page.chapterId);
    return chapter ? chapter.seriesId : null;
  }
  if (targetType === "TASK") {
    const task = await dependencies.taskRepository.findById(targetId);
    return task ? task.seriesId : null;
  }
  if (targetType === "SUBMISSION") {
    const submission = await dependencies.submissionRepository.findById(targetId);
    if (!submission) return null;
    const task = await dependencies.taskRepository.findById(submission.taskId);
    return task ? task.seriesId : null;
  }
  return null;
}

async function assertReadAccess(
  dependencies: CommentRouteDependencies,
  user: AuthUser,
  targetType: string,
  targetId: string
) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return;

  const seriesId = await getSeriesIdForTarget(dependencies, targetType, targetId);
  if (!seriesId) {
    throw new CommentServiceError("TARGET_NOT_FOUND", "Target object not found", 404);
  }

  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!role) {
    throw new CommentServiceError("FORBIDDEN", "Insufficient series permissions", 403);
  }
}

async function assertCreateAccess(
  dependencies: CommentRouteDependencies,
  user: AuthUser,
  targetType: string,
  targetId: string
) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return;

  const seriesId = await getSeriesIdForTarget(dependencies, targetType, targetId);
  if (!seriesId) {
    throw new CommentServiceError("TARGET_NOT_FOUND", "Target object not found", 404);
  }

  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!role) {
    throw new CommentServiceError("FORBIDDEN", "Insufficient series permissions to comment", 403);
  }
}

async function getAssignedAssistantId(
  dependencies: CommentRouteDependencies,
  targetType: string,
  targetId: string
): Promise<string | null> {
  if (targetType === "TASK") {
    const task = await dependencies.taskRepository.findById(targetId);
    return task ? task.assignedTo : null;
  }
  if (targetType === "SUBMISSION") {
    const submission = await dependencies.submissionRepository.findById(targetId);
    if (!submission) return null;
    const task = await dependencies.taskRepository.findById(submission.taskId);
    return task ? task.assignedTo : null;
  }
  return null;
}

function sendCommentError(res: Response, error: unknown) {
  if (error instanceof CommentServiceError) {
    res.status(error.statusCode).json(fail(error.message, error.code));
    return;
  }
  res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
}

export function createCommentRouter(dependencies: CommentRouteDependencies) {
  const router = Router({ mergeParams: true });
  const authenticate = requireAuth(dependencies.authVerifier);
  const service = createCommentService(dependencies.commentRepository);

  router.post("/comments", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertCreateAccess(dependencies, user, req.body.targetType as string, req.body.targetId as string);

      const comment = await service.createComment({
        targetType: req.body.targetType as CommentTargetType,
        targetId: req.body.targetId as string,
        pageId: req.body.pageId as string | undefined,
        annotationId: req.body.annotationId as string | undefined,
        content: req.body.content as string,
        createdBy: user.id
      });
      res.status(201).json(ok(comment));
    } catch (error) {
      sendCommentError(res, error);
    }
  });

  router.get("/comments/target/:targetType/:targetId", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      await assertReadAccess(dependencies, user, req.params.targetType as string, req.params.targetId as string);

      const comments = await service.listForTarget(
        req.params.targetType as CommentTargetType,
        req.params.targetId as string
      );
      res.json(ok(comments));
    } catch (error) {
      sendCommentError(res, error);
    }
  });

  router.get("/comments/:commentId", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const comment = await service.getById(req.params.commentId as string);
      await assertReadAccess(dependencies, user, comment.targetType, comment.targetId);
      res.json(ok(comment));
    } catch (error) {
      sendCommentError(res, error);
    }
  });

  router.patch("/comments/:commentId", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const isAdmin = user.systemRole === SYSTEM_ROLES.ADMIN;
      const updated = await service.updateComment(
        req.params.commentId as string,
        req.body.content as string,
        user.id,
        isAdmin
      );
      res.json(ok(updated));
    } catch (error) {
      sendCommentError(res, error);
    }
  });

  router.delete("/comments/:commentId", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const isAdmin = user.systemRole === SYSTEM_ROLES.ADMIN;
      await service.deleteComment(req.params.commentId as string, user.id, isAdmin);
      res.json(ok({ deleted: true }));
    } catch (error) {
      sendCommentError(res, error);
    }
  });

  router.post("/comments/:commentId/mark-fixed", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const comment = await service.getById(req.params.commentId as string);

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const assistantId = await getAssignedAssistantId(dependencies, comment.targetType, comment.targetId);
        if (!assistantId || assistantId !== user.id) {
          throw new CommentServiceError("FORBIDDEN", "Only the assigned Assistant can mark comments as fixed", 403);
        }
      }

      const updated = await service.markFixed(comment.id, user.id);
      res.json(ok(updated));
    } catch (error) {
      sendCommentError(res, error);
    }
  });

  router.post("/comments/:commentId/verify-fixed", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const comment = await service.getById(req.params.commentId as string);

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const seriesId = await getSeriesIdForTarget(dependencies, comment.targetType, comment.targetId);
        if (!seriesId) {
          throw new CommentServiceError("TARGET_NOT_FOUND", "Target series not found", 404);
        }
        const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
        if (role !== SERIES_MEMBER_ROLES.OWNER_MANGAKA && role !== SERIES_MEMBER_ROLES.CO_MANGAKA) {
          throw new CommentServiceError("FORBIDDEN", "Only Mangakas of this series can verify fixed comments", 403);
        }
      }

      const updated = await service.verifyFixed(comment.id, user.id);
      res.json(ok(updated));
    } catch (error) {
      sendCommentError(res, error);
    }
  });

  router.post("/comments/:commentId/resolve", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const comment = await service.getById(req.params.commentId as string);

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const seriesId = await getSeriesIdForTarget(dependencies, comment.targetType, comment.targetId);
        if (!seriesId) {
          throw new CommentServiceError("TARGET_NOT_FOUND", "Target series not found", 404);
        }
        const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
        if (role !== SERIES_MEMBER_ROLES.EDITOR) {
          throw new CommentServiceError("FORBIDDEN", "Only the assigned Series Editor can resolve comments", 403);
        }
      }

      const updated = await service.resolve(comment.id, user.id);
      res.json(ok(updated));
    } catch (error) {
      sendCommentError(res, error);
    }
  });

  router.post("/comments/:commentId/reopen", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const comment = await service.getById(req.params.commentId as string);

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const seriesId = await getSeriesIdForTarget(dependencies, comment.targetType, comment.targetId);
        if (!seriesId) {
          throw new CommentServiceError("TARGET_NOT_FOUND", "Target series not found", 404);
        }
        const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
        if (role !== SERIES_MEMBER_ROLES.EDITOR) {
          throw new CommentServiceError("FORBIDDEN", "Only the assigned Series Editor can reopen comments", 403);
        }
      }

      const updated = await service.reopen(comment.id, req.body.reason as string, user.id);
      res.json(ok(updated));
    } catch (error) {
      sendCommentError(res, error);
    }
  });

  return router;
}
