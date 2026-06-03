import { Router, type Response } from "express";
import crypto from "node:crypto";
import { fail, ok } from "../../shared/responses/api-response.js";
import { SERIES_MEMBER_ROLES, SYSTEM_ROLES } from "../../shared/constants/roles.js";
import { requireAuth, type AuthenticatedRequest, type AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, UserRepository } from "../auth/auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { PageRepository } from "../page/page.repository.js";
import type { RegionRepository } from "../region/region.repository.js";
import { createAiService } from "./ai.service.js";
import { storageService } from "../../infrastructure/storage/storage.service.js";
import { storageKeyUtil } from "../../infrastructure/storage/storage-key.util.js";

export type AiRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  chapterRepository: ChapterRepository;
  pageRepository: PageRepository;
  regionRepository: RegionRepository;
  aiServiceUrl?: string;
};

class AiRouteError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

function getClerkId(req: AuthenticatedRequest) {
  return req.auth!.clerkId;
}

async function resolveUser(dependencies: AiRouteDependencies, clerkId: string) {
  const user = await dependencies.userRepository.findByClerkId(clerkId);
  if (!user) {
    throw new AiRouteError("USER_NOT_SYNCED", "User not synced", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new AiRouteError("FORBIDDEN", "Account suspended", 403);
  }
  return user;
}

async function assertSeriesAiAccess(dependencies: AiRouteDependencies, user: AuthUser, seriesId: string) {
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return;
  if (user.systemRole !== SYSTEM_ROLES.MANGAKA) {
    throw new AiRouteError("FORBIDDEN", "Mangaka or Admin role required", 403);
  }
  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  const allowedRoles = [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA];
  if (!role || !allowedRoles.includes(role as any)) {
    throw new AiRouteError("FORBIDDEN", "Insufficient series role to run AI actions", 403);
  }
}

function sendAiError(res: Response, error: unknown) {
  if (error instanceof AiRouteError) {
    res.status(error.statusCode).json(fail(error.message, error.code));
    return;
  }
  res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
}

export function createAiRouter(dependencies: AiRouteDependencies) {
  const router = Router();
  const authenticate = requireAuth(dependencies.authVerifier);
  const aiService = createAiService(dependencies.aiServiceUrl);

  // GET /api/ai/health
  router.get("/ai/health", authenticate, async (_req, res) => {
    try {
      const isHealthy = await aiService.checkHealth();
      if (!isHealthy) {
        res.status(503).json(fail("AI Service unreachable", "AI_UNREACHABLE"));
        return;
      }
      res.json(ok({ status: "ok", message: "AI Service is healthy" }));
    } catch (error) {
      sendAiError(res, error);
    }
  });

  // POST /api/pages/:pageId/ai/bubble-detect
  router.post("/pages/:pageId/ai/bubble-detect", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const pageId = req.params.pageId as string;

      const page = await dependencies.pageRepository.findById(pageId);
      if (!page) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }

      const chapter = await dependencies.chapterRepository.findById(page.chapterId);
      if (!chapter) {
        res.status(404).json(fail("Chapter not found", "NOT_FOUND"));
        return;
      }

      await assertSeriesAiAccess(dependencies, user, chapter.seriesId);

      // Load original image buffer
      const buffer = await storageService.getFile(page.originalFileUrl);
      const bubbles = await aiService.detectBubbles(buffer);

      // Normalize coordinates
      const normalized = bubbles.map((b) => {
        let x = b.bbox.x / page.width;
        let y = b.bbox.y / page.height;
        let w = b.bbox.width / page.width;
        let h = b.bbox.height / page.height;

        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));
        w = Math.max(0.001, Math.min(1 - x, w));
        h = Math.max(0.001, Math.min(1 - y, h));

        return { x, y, width: w, height: h, confidence: b.confidence };
      });

      // Clear previous AI regions for this page
      if (dependencies.regionRepository.deleteByPageAndSource) {
        await dependencies.regionRepository.deleteByPageAndSource(pageId, "AI");
      }

      // Save new regions
      const saved = [];
      for (const r of normalized) {
        const reg = await dependencies.regionRepository.createRegion({
          pageId,
          type: "BUBBLE",
          source: "AI",
          shape: "RECTANGLE",
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          confidence: r.confidence,
          createdBy: user.id
        });
        saved.push(reg);
      }

      res.status(201).json(ok(saved));
    } catch (error) {
      sendAiError(res, error);
    }
  });

  // POST /api/pages/:pageId/ai/bubble-process
  router.post("/pages/:pageId/ai/bubble-process", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const pageId = req.params.pageId as string;

      const page = await dependencies.pageRepository.findById(pageId);
      if (!page) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }

      const chapter = await dependencies.chapterRepository.findById(page.chapterId);
      if (!chapter) {
        res.status(404).json(fail("Chapter not found", "NOT_FOUND"));
        return;
      }

      await assertSeriesAiAccess(dependencies, user, chapter.seriesId);

      // Load original image buffer
      const buffer = await storageService.getFile(page.originalFileUrl);
      const processRes = await aiService.processBubbles(buffer);

      // Normalize coordinates
      const normalized = processRes.bubbles.map((b) => {
        let x = b.bbox.x / page.width;
        let y = b.bbox.y / page.height;
        let w = b.bbox.width / page.width;
        let h = b.bbox.height / page.height;

        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));
        w = Math.max(0.001, Math.min(1 - x, w));
        h = Math.max(0.001, Math.min(1 - y, h));

        return { x, y, width: w, height: h, confidence: b.confidence };
      });

      // Clear previous AI regions
      if (dependencies.regionRepository.deleteByPageAndSource) {
        await dependencies.regionRepository.deleteByPageAndSource(pageId, "AI");
      }

      // Save new regions
      const savedRegions = [];
      for (const r of normalized) {
        const reg = await dependencies.regionRepository.createRegion({
          pageId,
          type: "BUBBLE",
          source: "AI",
          shape: "RECTANGLE",
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          confidence: r.confidence,
          createdBy: user.id
        });
        savedRegions.push(reg);
      }

      // Save output image to storage
      const processedImageBuffer = Buffer.from(processRes.image_base64, "base64");
      const uniqueId = crypto.randomUUID();
      const storageKey = storageKeyUtil.generateChapterPageKey(
        chapter.id,
        page.currentVersion,
        `processed_${uniqueId}.png`
      );

      const processedUrl = await storageService.uploadFile(storageKey, processedImageBuffer, "image/png");

      // Update page processedFileUrl and status
      const updatedPage = await dependencies.pageRepository.updatePage(pageId, {
        processedFileUrl: processedUrl,
        status: "AI_PROCESSED"
      });

      res.status(200).json(ok({ page: updatedPage, regions: savedRegions }));
    } catch (error) {
      sendAiError(res, error);
    }
  });

  // POST /api/chapters/:chapterId/ai/batch-bubble-process
  router.post("/chapters/:chapterId/ai/batch-bubble-process", authenticate, async (req, res) => {
    try {
      const user = await resolveUser(dependencies, getClerkId(req as AuthenticatedRequest));
      const chapterId = req.params.chapterId as string;

      const chapter = await dependencies.chapterRepository.findById(chapterId);
      if (!chapter) {
        res.status(404).json(fail("Chapter not found", "NOT_FOUND"));
        return;
      }

      await assertSeriesAiAccess(dependencies, user, chapter.seriesId);

      const pages = await dependencies.pageRepository.findPagesByChapter(chapterId);
      const results = [];

      for (const page of pages) {
        try {
          const buffer = await storageService.getFile(page.originalFileUrl);
          const processRes = await aiService.processBubbles(buffer);

          const normalized = processRes.bubbles.map((b) => {
            let x = b.bbox.x / page.width;
            let y = b.bbox.y / page.height;
            let w = b.bbox.width / page.width;
            let h = b.bbox.height / page.height;

            x = Math.max(0, Math.min(1, x));
            y = Math.max(0, Math.min(1, y));
            w = Math.max(0.001, Math.min(1 - x, w));
            h = Math.max(0.001, Math.min(1 - y, h));

            return { x, y, width: w, height: h, confidence: b.confidence };
          });

          if (dependencies.regionRepository.deleteByPageAndSource) {
            await dependencies.regionRepository.deleteByPageAndSource(page.id, "AI");
          }

          for (const r of normalized) {
            await dependencies.regionRepository.createRegion({
              pageId: page.id,
              type: "BUBBLE",
              source: "AI",
              shape: "RECTANGLE",
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              confidence: r.confidence,
              createdBy: user.id
            });
          }

          const processedImageBuffer = Buffer.from(processRes.image_base64, "base64");
          const uniqueId = crypto.randomUUID();
          const storageKey = storageKeyUtil.generateChapterPageKey(
            chapter.id,
            page.currentVersion,
            `processed_${uniqueId}.png`
          );

          const processedUrl = await storageService.uploadFile(storageKey, processedImageBuffer, "image/png");

          await dependencies.pageRepository.updatePage(page.id, {
            processedFileUrl: processedUrl,
            status: "AI_PROCESSED"
          });

          results.push({ pageId: page.id, status: "success" });
        } catch (pageErr: any) {
          console.error(`Batch process failed for page ${page.id}:`, pageErr.message);
          results.push({ pageId: page.id, status: "failed", error: pageErr.message });
        }
      }

      res.status(200).json(ok({ results, processedCount: results.filter(r => r.status === "success").length }));
    } catch (error) {
      sendAiError(res, error);
    }
  });

  return router;
}
