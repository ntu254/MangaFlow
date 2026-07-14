import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  listSeries,
  getSeries,
  patchSeries,
  seriesLifecycleAction,
  deleteSeries,
  listSeriesChapters,
  getSeriesSummary,
  getSeriesActivity,
  listMembers,
  addMember,
  updateMember,
  removeMember,
  inviteAssistant,
  getChapter,
  patchChapter,
  chapterAction,
  listChapters,
  getChapterPages,
  getChapterReadiness,
} from "../controllers/series.controller.js";
import {
  createSeries,
  createSeriesChapter,
} from "../modules/series/presentation/series-production.controller.js";
import {
  createChapterPage,
  deletePage,
  updatePage,
} from "../modules/studio/presentation/page-production.controller.js";
import {
  displayUrl,
  presignDownload,
  presignUpload,
} from "../modules/files/presentation/file.controller.js";

const router = Router();

// Series
router.get("/series", listSeries);
router.post("/series", requireRole("EDITOR", "MANGAKA") as any, createSeries);
router.get("/series/:id", getSeries);
router.patch("/series/:id", requireRole("MANGAKA") as any, patchSeries);
router.post(
  "/series/:id/actions/:action",
  requireRole("ADMIN", "EDITOR", "MANGAKA") as any,
  seriesLifecycleAction,
);
router.delete("/series/:id", requireRole("ADMIN", "MANGAKA") as any, deleteSeries);
router.get("/series/:id/chapters", listSeriesChapters);
router.post("/series/:id/chapters", requireRole("MANGAKA") as any, createSeriesChapter);
router.get("/series/:seriesId/summary", getSeriesSummary);
router.get("/series/:seriesId/activity", getSeriesActivity);

// Members
router.get("/series/:seriesId/members", listMembers);
router.post("/series/:seriesId/members", requireRole("MANGAKA") as any, addMember);
router.patch(
  "/series/:seriesId/members/:memberId",
  requireRole("MANGAKA") as any,
  updateMember,
);
router.delete(
  "/series/:seriesId/members/:memberId",
  requireRole("MANGAKA") as any,
  removeMember,
);
router.post(
  "/series/:seriesId/invites",
  requireRole("MANGAKA") as any,
  inviteAssistant,
);

// Chapters (standalone)
router.get(
  "/chapters",
  requireRole("EDITOR", "MANGAKA", "ASSISTANT", "ADMIN") as any,
  listChapters,
);
router.get("/chapters/:chapterId", getChapter);
router.patch("/chapters/:chapterId", requireRole("MANGAKA") as any, patchChapter);
router.post(
  "/chapters/:chapterId/actions/:action",
  requireRole("EDITOR", "MANGAKA", "ASSISTANT") as any,
  chapterAction,
);
router.get("/chapters/:chapterId/pages", getChapterPages);
router.get("/chapters/:chapterId/readiness", getChapterReadiness);
router.post(
  "/chapters/:chapterId/pages",
  requireRole("EDITOR", "MANGAKA") as any,
  createChapterPage,
);

// Pages
router.patch("/pages/:pageId", requireRole("MANGAKA") as any, updatePage);
router.delete("/pages/:pageId", requireRole("MANGAKA") as any, deletePage);

// Files
router.post(
  "/files/presign-upload",
  requireRole("EDITOR", "MANGAKA", "ASSISTANT") as any,
  presignUpload,
);
router.post(
  "/files/presign-download",
  requireRole("ADMIN", "BOARD", "EDITOR", "MANGAKA", "ASSISTANT") as any,
  presignDownload,
);
router.post("/files/display-url", requireRole("EDITOR", "MANGAKA", "ASSISTANT") as any, displayUrl);

export default router;
