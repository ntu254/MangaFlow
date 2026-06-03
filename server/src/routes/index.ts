import { Router } from "express";
import {
  createClerkAuthVerifier,
  type AuthVerifier
} from "../modules/auth/auth.middleware.js";
import { createMongoUserRepository } from "../modules/auth/auth.repository.js";
import { createAuthRouter } from "../modules/auth/auth.routes.js";
import type { UserRepository } from "../modules/auth/auth.service.js";
import { createAdminRouter } from "../modules/admin/admin.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { createMongoSeriesRepository } from "../modules/series/series.repository.js";
import { createSeriesRouter } from "../modules/series/series.routes.js";
import type { SeriesRepository } from "../modules/series/series.service.js";
import { createMongoManuscriptRepository, type ManuscriptRepository } from "../modules/manuscript/manuscript.repository.js";
import { createManuscriptRouter } from "../modules/manuscript/manuscript.routes.js";
import { createMongoChapterRepository, type ChapterRepository } from "../modules/chapter/chapter.repository.js";
import { createChapterRouter } from "../modules/chapter/chapter.routes.js";
import { createMongoPageRepository, type PageRepository } from "../modules/page/page.repository.js";
import { createPageRouter } from "../modules/page/page.routes.js";
import { createMongoFileRepository, type FileRepository } from "../modules/file/file.repository.js";
import { createFileService } from "../modules/file/file.service.js";
import { createFileRouter } from "../modules/file/file.routes.js";
import { createMongoRegionRepository, type RegionRepository } from "../modules/region/region.repository.js";
import { createRegionRouter } from "../modules/region/region.routes.js";
import { createMongoAnnotationRepository, type AnnotationRepository } from "../modules/annotation/annotation.repository.js";
import { createAnnotationRouter } from "../modules/annotation/annotation.routes.js";
import { createMongoTaskRepository, type TaskRepository } from "../modules/task/task.repository.js";
import { createTaskRouter } from "../modules/task/task.routes.js";
import { createMongoSubmissionRepository, type SubmissionRepository } from "../modules/submission/submission.repository.js";
import { createSubmissionRouter } from "../modules/submission/submission.routes.js";
import { createMongoCommentRepository, type CommentRepository } from "../modules/comment/comment.repository.js";
import { createCommentRouter } from "../modules/comment/comment.routes.js";
import { createCommentService } from "../modules/comment/comment.service.js";
import { createMongoBoardRepository, createBoardService, createBoardRouter, type BoardRepository } from "../modules/board/index.js";
import { createMongoRankingRepository, createRankingService, createRankingRouter, type RankingRepository } from "../modules/ranking/index.js";
import { createMongoPayrollRepository, createPayrollRouter, type PayrollRepository } from "../modules/payroll/index.js";
import { createAiRouter } from "../modules/ai/ai.routes.js";
import {
  createMongoNotificationRepository,
  createNotificationRouter,
  createNotificationService,
  type NotificationRepository
} from "../modules/notification/index.js";

export type ApiRouterDependencies = {
  authVerifier?: AuthVerifier;
  userRepository?: UserRepository;
  seriesRepository?: SeriesRepository;
  manuscriptRepository?: ManuscriptRepository;
  chapterRepository?: ChapterRepository;
  pageRepository?: PageRepository;
  fileRepository?: FileRepository;
  regionRepository?: RegionRepository;
  annotationRepository?: AnnotationRepository;
  taskRepository?: TaskRepository;
  submissionRepository?: SubmissionRepository;
  commentRepository?: CommentRepository;
  boardRepository?: BoardRepository;
  rankingRepository?: RankingRepository;
  payrollRepository?: PayrollRepository;
  notificationRepository?: NotificationRepository;
  aiServiceUrl?: string;
};

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);

export function createApiRouter(dependencies: ApiRouterDependencies = {}) {
  const router = Router();

  const commentRepo = dependencies.commentRepository ?? createMongoCommentRepository();
  const commentService = createCommentService(commentRepo);
  const pageRepo = dependencies.pageRepository ?? createMongoPageRepository();
  const boardRepo = dependencies.boardRepository ?? createMongoBoardRepository();
  const boardService = createBoardService(boardRepo, dependencies.userRepository ?? createMongoUserRepository());
  const rankingRepo = dependencies.rankingRepository ?? createMongoRankingRepository();
  const rankingService = createRankingService(rankingRepo);
  const taskRepo = dependencies.taskRepository ?? createMongoTaskRepository();
  const payrollRepo = dependencies.payrollRepository ?? createMongoPayrollRepository();
  const regionRepo = dependencies.regionRepository ?? createMongoRegionRepository();

  router.use("/health", healthRouter);
  router.use(
    "/auth",
    createAuthRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository()
    })
  );
  router.use(
    "/admin",
    createAdminRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository()
    })
  );
  router.use(
    "/series",
    createSeriesRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository()
    })
  );

  router.use(
    "/board",
    createBoardRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      boardService
    })
  );

  router.use(
    createRankingRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      rankingService
    })
  );
  
  router.use(
    createPayrollRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      taskRepository: taskRepo,
      payrollRepository: payrollRepo
    })
  );

  router.use(
    createAiRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: pageRepo,
      regionRepository: regionRepo,
      aiServiceUrl: dependencies.aiServiceUrl
    })
  );

  const notifRepo = dependencies.notificationRepository ?? createMongoNotificationRepository();
  const notifService = createNotificationService(notifRepo);
  router.use(
    createNotificationRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      notificationService: notifService
    })
  );

  router.use(
    "/series/:seriesId/manuscripts",
    createManuscriptRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      manuscriptRepository: dependencies.manuscriptRepository ?? createMongoManuscriptRepository(),
      fileRepository: dependencies.fileRepository
    })
  );

  router.use(
    "/manuscripts",
    createManuscriptRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      manuscriptRepository: dependencies.manuscriptRepository ?? createMongoManuscriptRepository(),
      fileRepository: dependencies.fileRepository
    })
  );

  router.use(
    "/series/:seriesId/chapters",
    createChapterRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: pageRepo,
      commentService
    })
  );

  router.use(
    "/chapters",
    createChapterRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: pageRepo,
      commentService
    })
  );

  router.use(
    "/chapters/:chapterId/pages",
    createPageRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: pageRepo,
      fileRepository: dependencies.fileRepository,
      commentService
    })
  );

  router.use(
    createSubmissionRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      taskRepository: taskRepo,
      submissionRepository: dependencies.submissionRepository ?? createMongoSubmissionRepository()
    })
  );

  router.use(
    createCommentRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      manuscriptRepository: dependencies.manuscriptRepository ?? createMongoManuscriptRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: dependencies.pageRepository ?? createMongoPageRepository(),
      taskRepository: taskRepo,
      submissionRepository: dependencies.submissionRepository ?? createMongoSubmissionRepository(),
      commentRepository: dependencies.commentRepository ?? createMongoCommentRepository()
    })
  );


  router.use(
    createTaskRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: dependencies.pageRepository ?? createMongoPageRepository(),
      regionRepository: dependencies.regionRepository ?? createMongoRegionRepository(),
      taskRepository: taskRepo
    })
  );

  router.use(
    createRegionRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: dependencies.pageRepository ?? createMongoPageRepository(),
      regionRepository: dependencies.regionRepository ?? createMongoRegionRepository()
    })
  );

  router.use(
    createAnnotationRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: dependencies.pageRepository ?? createMongoPageRepository(),
      regionRepository: dependencies.regionRepository ?? createMongoRegionRepository(),
      annotationRepository: dependencies.annotationRepository ?? createMongoAnnotationRepository()
    })
  );

  router.use(
    "/pages",
    createPageRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: pageRepo,
      fileRepository: dependencies.fileRepository,
      commentService
    })
  );

  const fileRepository = dependencies.fileRepository ?? createMongoFileRepository();
  const fileService = createFileService(fileRepository);
  router.use(
    "/files",
    createFileRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      fileService
    })
  );

  return router;
}
