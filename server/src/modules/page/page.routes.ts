import { Router } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { requireAuth, type AuthVerifier } from "../auth/auth.middleware.js";
import { requireSystemRole, type RoleAuthorizedRequest } from "../auth/rbac.middleware.js";
import { SYSTEM_ROLES, SERIES_MEMBER_ROLES } from "../../shared/constants/roles.js";
import { createPageService, PageServiceError, type Page } from "./page.service.js";
import type { PageRepository } from "./page.repository.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { UserRepository } from "../auth/auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";
import { createMongoFileRepository, type FileRepository } from "../file/file.repository.js";
import { createFileService } from "../file/file.service.js";
import { upload } from "../../shared/middleware/upload.middleware.js";
import { storageService } from "../../infrastructure/storage/storage.service.js";
import { storageKeyUtil } from "../../infrastructure/storage/storage-key.util.js";
import { imageResizeService, ImageResizeService } from "../../infrastructure/image/image-resize.service.js";
import type { CommentService } from "../comment/comment.service.js";

export type PageRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  chapterRepository: ChapterRepository;
  pageRepository: PageRepository;
  fileRepository?: FileRepository;
  commentService?: CommentService;
};

async function resolvePageUrls(page: Page): Promise<Page> {
  const resolved = { ...page };
  if (resolved.originalFileUrl) {
    resolved.originalFileUrl = await storageService.getSignedUrl(resolved.originalFileUrl);
  }
  if (resolved.previewUrl) {
    resolved.previewUrl = await storageService.getSignedUrl(resolved.previewUrl);
  }
  if (resolved.thumbnailUrl) {
    resolved.thumbnailUrl = await storageService.getSignedUrl(resolved.thumbnailUrl);
  }
  if (resolved.processedFileUrl) {
    resolved.processedFileUrl = await storageService.getSignedUrl(resolved.processedFileUrl);
  }
  return resolved;
}

async function resolvePageUrlsList(pages: Page[]): Promise<Page[]> {
  return Promise.all(pages.map(resolvePageUrls));
}

export function createPageRouter(dependencies: PageRouteDependencies) {
  const router = Router({ mergeParams: true });
  const service = createPageService(dependencies.pageRepository);
  const authenticate = requireAuth(dependencies.authVerifier);
  
  const requireSystemMangaka = requireSystemRole([SYSTEM_ROLES.MANGAKA], dependencies.userRepository);

  // POST /api/chapters/:chapterId/pages
  router.post("/", authenticate, requireSystemMangaka, upload.array("files", 50), async (req, res) => {
    try {
      const chapterId = req.params.chapterId as string;
      const chapter = await dependencies.chapterRepository.findById(chapterId);
      if (!chapter) {
        res.status(404).json(fail("Chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = authReq.localUser;

      // Check series role (Mangaka owner/co-creator)
      const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user!.id);
      const allowedRoles = [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA];
      if (!role || !allowedRoles.includes(role as any)) {
        res.status(403).json(fail("Insufficient series role to upload pages", "FORBIDDEN"));
        return;
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        res.status(400).json(fail("No files uploaded", "BAD_REQUEST"));
        return;
      }

      const currentPages = await service.listByChapter(chapterId);
      let nextPageNum = currentPages.length > 0 ? Math.max(...currentPages.map(p => p.pageNumber)) + 1 : 1;

      const fileRepo = dependencies.fileRepository ?? createMongoFileRepository();
      const fileService = createFileService(fileRepo);

      const createdPages = [];

      for (const file of files) {
        const pageNumber = nextPageNum++;

        // Extract metadata and dimensions
        const metadata = await imageResizeService.getImageMetadata(file.buffer);
        const width = metadata.width ?? 1200;
        const height = metadata.height ?? 1600;

        // Generate resized images using sharp
        const aiCopyBuffer = await imageResizeService.resizeImage(file.buffer, ImageResizeService.AI_COPY_WIDTH);
        const previewBuffer = await imageResizeService.resizeImage(file.buffer, ImageResizeService.PREVIEW_WIDTH);
        const thumbnailBuffer = await imageResizeService.resizeImage(file.buffer, ImageResizeService.THUMBNAIL_WIDTH);

        // Define unique keys
        const version = 1;
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniquePrefix = `${Date.now()}_${Math.floor(Math.random() * 1000)}_`;
        const originalKey = storageKeyUtil.generateChapterPageKey(chapterId, version, `${uniquePrefix}original_${cleanFileName}`);
        const aiKey = storageKeyUtil.generateChapterPageKey(chapterId, version, `${uniquePrefix}ai_${cleanFileName}`);
        const previewKey = storageKeyUtil.generateChapterPageKey(chapterId, version, `${uniquePrefix}preview_${cleanFileName}`);
        const thumbnailKey = storageKeyUtil.generateChapterPageKey(chapterId, version, `${uniquePrefix}thumb_${cleanFileName}`);

        // Upload all versions to storage
        const originalUrl = await storageService.uploadFile(originalKey, file.buffer, file.mimetype);
        const aiProcessUrl = await storageService.uploadFile(aiKey, aiCopyBuffer, file.mimetype);
        const previewUrl = await storageService.uploadFile(previewKey, previewBuffer, file.mimetype);
        const thumbnailUrl = await storageService.uploadFile(thumbnailKey, thumbnailBuffer, file.mimetype);

        // Create page
        const page = await service.createPage({
          chapterId,
          pageNumber,
          originalFileUrl: originalUrl,
          previewUrl,
          thumbnailUrl,
          width,
          height
        });

        // Create associated FileAsset record
        await fileService.createFileAsset({
          ownerType: "PAGE",
          ownerId: page.id,
          originalUrl,
          aiProcessUrl,
          previewUrl,
          thumbnailUrl,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          width,
          height,
          versionNumber: 1,
          uploadedBy: user!.id
        });

        const resolvedPage = await resolvePageUrls(page);
        createdPages.push(resolvedPage);
      }

      res.status(201).json(ok(files.length === 1 ? createdPages[0] : createdPages));
    } catch (error) {
      if (error instanceof PageServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // GET /api/chapters/:chapterId/pages
  router.get("/", authenticate, async (req, res) => {
    try {
      const chapterId = req.params.chapterId as string;
      const chapter = await dependencies.chapterRepository.findById(chapterId);
      if (!chapter) {
        res.status(404).json(fail("Chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findById(authReq.user!.id);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
        if (!role) {
          res.status(403).json(fail("Insufficient series role to view pages", "FORBIDDEN"));
          return;
        }
      }

      const list = await service.listByChapter(chapterId);
      const resolvedList = await resolvePageUrlsList(list);
      res.json(ok(resolvedList));
    } catch (error) {
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // GET /api/pages/:pageId
  router.get("/:pageId", authenticate, async (req, res) => {
    try {
      const pageId = req.params.pageId as string;
      const page = await service.getById(pageId);
      const chapter = await dependencies.chapterRepository.findById(page.chapterId);
      if (!chapter) {
        res.status(404).json(fail("Associated chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findById(authReq.user!.id);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
        if (!role) {
          res.status(403).json(fail("Insufficient series role to view page", "FORBIDDEN"));
          return;
        }
      }

      const resolvedPage = await resolvePageUrls(page);
      res.json(ok(resolvedPage));
    } catch (error) {
      if (error instanceof PageServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // DELETE /api/pages/:pageId
  router.delete("/:pageId", authenticate, requireSystemMangaka, async (req, res) => {
    try {
      const pageId = req.params.pageId as string;
      const page = await service.getById(pageId);
      const chapter = await dependencies.chapterRepository.findById(page.chapterId);
      if (!chapter) {
        res.status(404).json(fail("Associated chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = authReq.localUser;

      const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user!.id);
      const allowedRoles = [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA];
      if (!role || !allowedRoles.includes(role as any)) {
        res.status(403).json(fail("Only Mangaka owners can delete pages", "FORBIDDEN"));
        return;
      }

      // 1. Delete associated physical files and metadata
      const fileRepo = dependencies.fileRepository ?? createMongoFileRepository();
      const fileService = createFileService(fileRepo);
      const fileAssets = await fileService.getByOwner("PAGE", pageId);
      for (const asset of fileAssets) {
        await fileService.deleteFileAsset(asset.id);
      }

      // 2. Delete page
      const deleted = await service.deletePage(pageId);
      res.json(ok({ deleted }));
    } catch (error) {
      if (error instanceof PageServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // POST /api/pages/:pageId/editor-approve
  router.post("/:pageId/editor-approve", authenticate, async (req, res) => {
    try {
      const pageId = req.params.pageId as string;
      const page = await service.getById(pageId);
      const chapter = await dependencies.chapterRepository.findById(page.chapterId);
      if (!chapter) {
        res.status(404).json(fail("Associated chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findById(authReq.user!.id);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        if (user.systemRole !== SYSTEM_ROLES.EDITOR) {
          res.status(403).json(fail("Only Editors or Admins can approve pages", "FORBIDDEN"));
          return;
        }

        const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
        if (role !== SERIES_MEMBER_ROLES.EDITOR) {
          res.status(403).json(fail("Insufficient series role to approve page", "FORBIDDEN"));
          return;
        }
      }

      if (!dependencies.commentService) {
        res.status(500).json(fail("Comment service not configured", "INTERNAL_ERROR"));
        return;
      }

      const updatedPage = await service.editorApprovePage(pageId, dependencies.commentService);
      const resolved = await resolvePageUrls(updatedPage);
      res.json(ok(resolved));
    } catch (error) {
      if (error instanceof PageServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // POST /api/pages/:pageId/request-revision
  router.post("/:pageId/request-revision", authenticate, async (req, res) => {
    try {
      const pageId = req.params.pageId as string;
      const page = await service.getById(pageId);
      const chapter = await dependencies.chapterRepository.findById(page.chapterId);
      if (!chapter) {
        res.status(404).json(fail("Associated chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findById(authReq.user!.id);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        if (user.systemRole !== SYSTEM_ROLES.EDITOR) {
          res.status(403).json(fail("Only Editors or Admins can request page revisions", "FORBIDDEN"));
          return;
        }

        const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
        if (role !== SERIES_MEMBER_ROLES.EDITOR) {
          res.status(403).json(fail("Insufficient series role to request page revision", "FORBIDDEN"));
          return;
        }
      }

      const updatedPage = await service.requestPageRevision(pageId);
      const resolved = await resolvePageUrls(updatedPage);
      res.json(ok(resolved));
    } catch (error) {
      if (error instanceof PageServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  return router;
}
