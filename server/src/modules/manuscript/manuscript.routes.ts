import { Router } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { requireAuth, type AuthVerifier } from "../auth/auth.middleware.js";
import { requireSystemRole, requireSeriesRole, type RoleAuthorizedRequest } from "../auth/rbac.middleware.js";
import { SYSTEM_ROLES, SERIES_MEMBER_ROLES } from "../../shared/constants/roles.js";
import { createManuscriptService, ManuscriptServiceError, type Manuscript } from "./manuscript.service.js";
import type { ManuscriptRepository } from "./manuscript.repository.js";
import type { UserRepository } from "../auth/auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";
import { createMongoFileRepository, type FileRepository } from "../file/file.repository.js";
import { createFileService } from "../file/file.service.js";
import { upload } from "../../shared/middleware/upload.middleware.js";
import { storageService } from "../../infrastructure/storage/storage.service.js";
import { storageKeyUtil } from "../../infrastructure/storage/storage-key.util.js";

export type ManuscriptRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  manuscriptRepository: ManuscriptRepository;
  fileRepository?: FileRepository;
};

async function resolveManuscriptUrls(manuscript: Manuscript): Promise<Manuscript> {
  const resolved = { ...manuscript };
  if (resolved.fileUrls) {
    resolved.fileUrls = await Promise.all(resolved.fileUrls.map(url => storageService.getSignedUrl(url)));
  }
  if (resolved.previewUrls) {
    resolved.previewUrls = await Promise.all(resolved.previewUrls.map(url => storageService.getSignedUrl(url)));
  }
  return resolved;
}

async function resolveManuscriptUrlsList(manuscripts: Manuscript[]): Promise<Manuscript[]> {
  return Promise.all(manuscripts.map(resolveManuscriptUrls));
}

export function createManuscriptRouter(dependencies: ManuscriptRouteDependencies) {
  const router = Router({ mergeParams: true });
  const service = createManuscriptService(dependencies.manuscriptRepository);
  const authenticate = requireAuth(dependencies.authVerifier);
  
  const requireSystemMangaka = requireSystemRole([SYSTEM_ROLES.MANGAKA], dependencies.userRepository);
  const requireSystemEditor = requireSystemRole([SYSTEM_ROLES.EDITOR], dependencies.userRepository);
  const requireSystemSeriesParticipant = requireSystemRole(
    [SYSTEM_ROLES.MANGAKA, SYSTEM_ROLES.ASSISTANT, SYSTEM_ROLES.EDITOR],
    dependencies.userRepository
  );
  
  const checkMember = requireSeriesRole(
    [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA, SERIES_MEMBER_ROLES.EDITOR, SERIES_MEMBER_ROLES.ASSISTANT],
    dependencies.seriesRepository
  );
  
  const checkMangakaMember = requireSeriesRole(
    [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA],
    dependencies.seriesRepository
  );

  const checkEditorMember = requireSeriesRole(
    [SERIES_MEMBER_ROLES.EDITOR],
    dependencies.seriesRepository
  );

  // Mangaka uploads a manuscript
  router.post("/", authenticate, requireSystemMangaka, checkMangakaMember, upload.array("files", 10), async (req, res) => {
    const user = (req as RoleAuthorizedRequest).localUser;
    const seriesId = req.params.seriesId as string;
    
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        res.status(400).json(fail("No files uploaded", "BAD_REQUEST"));
        return;
      }

      const fileRepo = dependencies.fileRepository ?? createMongoFileRepository();
      const fileService = createFileService(fileRepo);

      const fileUrls = [];

      for (const file of files) {
        const version = 1;
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniquePrefix = `${Date.now()}_${Math.floor(Math.random() * 1000)}_`;
        const key = storageKeyUtil.generateManuscriptKey(seriesId, version, `${uniquePrefix}${cleanFileName}`);

        const url = await storageService.uploadFile(key, file.buffer, file.mimetype);
        fileUrls.push(url);
      }

      const manuscript = await service.createManuscript({
        seriesId,
        title: req.body.title,
        description: req.body.description,
        fileUrls
      }, user!.id);

      // Register uploaded files as FileAsset metadata
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const originalUrl = fileUrls[i];
        
        await fileService.createFileAsset({
          ownerType: "MANUSCRIPT",
          ownerId: manuscript.id,
          originalUrl,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          versionNumber: 1,
          uploadedBy: user!.id
        });
      }

      const resolved = await resolveManuscriptUrls(manuscript);
      res.status(201).json(ok(resolved));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // Get series manuscripts
  router.get("/", authenticate, requireSystemSeriesParticipant, checkMember, async (req, res) => {
    const seriesId = req.params.seriesId as string;
    const list = await service.listBySeries(seriesId);
    const resolvedList = await resolveManuscriptUrlsList(list);
    res.json(ok(resolvedList));
  });

  // Get a single manuscript
  router.get("/:manuscriptId", authenticate, requireSystemSeriesParticipant, checkMember, async (req, res) => {
    try {
      const manuscript = await service.getById(req.params.manuscriptId as string);
      if (manuscript.seriesId !== req.params.seriesId) {
        res.status(404).json(fail("Manuscript not found in this series", "NOT_FOUND"));
        return;
      }
      const resolved = await resolveManuscriptUrls(manuscript);
      res.json(ok(resolved));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // Mangaka submits
  router.patch("/:manuscriptId/submit", authenticate, requireSystemMangaka, checkMangakaMember, async (req, res) => {
    try {
      const existing = await service.getById(req.params.manuscriptId as string);
      if (existing.seriesId !== req.params.seriesId) {
        res.status(404).json(fail("Manuscript not found in this series", "NOT_FOUND"));
        return;
      }

      const manuscript = await service.submitManuscript(req.params.manuscriptId as string);
      if (!manuscript) {
        res.status(404).json(fail("Manuscript not found", "NOT_FOUND"));
        return;
      }
      const resolved = await resolveManuscriptUrls(manuscript);
      res.json(ok(resolved));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // Editor reviews, approves, requests revision
  router.patch("/:manuscriptId/review", authenticate, requireSystemEditor, checkEditorMember, async (req, res) => {
    try {
      const action = req.body.action; // 'start', 'approve', 'request_revision'
      const manuscriptId = req.params.manuscriptId as string;
      const existing = await service.getById(manuscriptId);
      if (existing.seriesId !== req.params.seriesId) {
        res.status(404).json(fail("Manuscript not found in this series", "NOT_FOUND"));
        return;
      }

      let manuscript;
      switch (action) {
        case "start":
          manuscript = await service.startEditorReview(manuscriptId);
          break;
        case "approve":
          manuscript = await service.approveManuscript(manuscriptId);
          break;
        case "request_revision":
          manuscript = await service.requestRevision(manuscriptId);
          break;
        default:
          res.status(400).json(fail("Invalid action", "BAD_REQUEST"));
          return;
      }
      const resolved = manuscript ? await resolveManuscriptUrls(manuscript) : null;
      res.json(ok(resolved));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // POST /:manuscriptId/approve
  router.post("/:manuscriptId/approve", authenticate, async (req, res) => {
    try {
      const manuscriptId = req.params.manuscriptId as string;
      const manuscript = await service.getById(manuscriptId);
      
      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        if (user.systemRole !== SYSTEM_ROLES.EDITOR) {
          res.status(403).json(fail("Only Editors or Admins can approve manuscripts", "FORBIDDEN"));
          return;
        }

        const role = await dependencies.seriesRepository.getSeriesMemberRole(manuscript.seriesId, user.id);
        if (role !== SERIES_MEMBER_ROLES.EDITOR) {
          res.status(403).json(fail("Insufficient series role to approve manuscript", "FORBIDDEN"));
          return;
        }
      }

      const updated = await service.approveManuscript(manuscriptId);
      if (!updated) {
        res.status(404).json(fail("Manuscript not found", "NOT_FOUND"));
        return;
      }
      const resolved = await resolveManuscriptUrls(updated);
      res.json(ok(resolved));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // POST /:manuscriptId/request-revision
  router.post("/:manuscriptId/request-revision", authenticate, async (req, res) => {
    try {
      const manuscriptId = req.params.manuscriptId as string;
      const manuscript = await service.getById(manuscriptId);
      
      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        if (user.systemRole !== SYSTEM_ROLES.EDITOR) {
          res.status(403).json(fail("Only Editors or Admins can request manuscript revisions", "FORBIDDEN"));
          return;
        }

        const role = await dependencies.seriesRepository.getSeriesMemberRole(manuscript.seriesId, user.id);
        if (role !== SERIES_MEMBER_ROLES.EDITOR) {
          res.status(403).json(fail("Insufficient series role to request manuscript revision", "FORBIDDEN"));
          return;
        }
      }

      const updated = await service.requestRevision(manuscriptId);
      if (!updated) {
        res.status(404).json(fail("Manuscript not found", "NOT_FOUND"));
        return;
      }
      const resolved = await resolveManuscriptUrls(updated);
      res.json(ok(resolved));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  return router;
}
