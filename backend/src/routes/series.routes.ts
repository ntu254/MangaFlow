import { Router } from "express";
import { requireExactRole, requireRole } from "../middleware/auth.js";
import {
  listSeries,
  getSeries,
  patchSeries,
  seriesLifecycleAction,
  listSeriesChapters,
  createSeriesChapter,
  getSeriesSummary,
  getSeriesActivity,
  listMembers,
  addMember,
  updateMember,
  removeMember,
  inviteAssistant,
  listSeriesInvites,
  acceptSeriesInvite,
  declineSeriesInvite,
  getChapter,
  patchChapter,
  chapterAction,
  listChapters,
  getChapterPages,
  getChapterReadiness,
  listChapterReviews,
  createChapterPage,
  updatePage,
  reorderChapterPages,
  deletePage,
  presignUpload,
  presignDownload,
  displayUrl,
} from "../controllers/series.controller.js";

const router = Router();

// Series
router.get("/series", listSeries);
router.get("/series/invites", listSeriesInvites);
router.post("/series/invites/:inviteId/accept", requireExactRole("ASSISTANT") as any, acceptSeriesInvite);
router.post("/series/invites/:inviteId/decline", requireExactRole("ASSISTANT") as any, declineSeriesInvite);
router.get("/series/:id", getSeries);
router.patch("/series/:id", requireExactRole("EDITOR", "MANGAKA") as any, patchSeries);
router.post(
  "/series/:id/actions/:action",
  requireExactRole("EDITOR", "MANGAKA") as any,
  seriesLifecycleAction,
);
router.get("/series/:id/chapters", listSeriesChapters);
router.post("/series/:id/chapters", requireExactRole("MANGAKA") as any, createSeriesChapter);
router.get("/series/:seriesId/summary", getSeriesSummary);
router.get("/series/:seriesId/activity", getSeriesActivity);

// Members
router.get("/series/:seriesId/members", listMembers);
router.post("/series/:seriesId/members", requireExactRole("EDITOR", "MANGAKA") as any, addMember);
router.patch(
  "/series/:seriesId/members/:memberId",
  requireExactRole("EDITOR", "MANGAKA") as any,
  updateMember,
);
router.delete(
  "/series/:seriesId/members/:memberId",
  requireExactRole("EDITOR", "MANGAKA") as any,
  removeMember,
);
router.post(
  "/series/:seriesId/invites",
  requireExactRole("EDITOR", "MANGAKA") as any,
  inviteAssistant,
);
router.get("/series/:seriesId/invites", listSeriesInvites);

// Chapters (standalone)
router.get("/chapters", requireRole("EDITOR", "MANGAKA", "ASSISTANT") as any, listChapters);
router.get("/chapters/:chapterId", getChapter);
router.patch("/chapters/:chapterId", requireExactRole("MANGAKA") as any, patchChapter);
router.post(
  "/chapters/:chapterId/actions/:action",
  requireExactRole("EDITOR", "MANGAKA", "ASSISTANT") as any,
  chapterAction,
);
router.get("/chapters/:chapterId/pages", getChapterPages);
router.get("/chapters/:chapterId/readiness", getChapterReadiness);
router.get(
  "/chapters/:chapterId/reviews",
  requireRole("EDITOR", "MANGAKA") as any,
  listChapterReviews,
);
router.post("/chapters/:chapterId/pages", requireExactRole("MANGAKA") as any, createChapterPage);

// Pages
router.patch(
  "/chapters/:chapterId/pages/reorder",
  requireExactRole("MANGAKA") as any,
  reorderChapterPages,
);
router.patch("/pages/:pageId", requireExactRole("MANGAKA") as any, updatePage);
router.delete("/pages/:pageId", requireExactRole("MANGAKA") as any, deletePage);

// Files
router.post(
  "/files/presign-upload",
  requireExactRole("EDITOR", "MANGAKA", "ASSISTANT") as any,
  presignUpload,
);
router.post(
  "/files/presign-download",
  requireExactRole("BOARD", "EDITOR", "MANGAKA", "ASSISTANT") as any,
  presignDownload,
);
router.post(
  "/files/display-url",
  requireExactRole("BOARD", "EDITOR", "MANGAKA", "ASSISTANT") as any,
  displayUrl,
);

export default router;
