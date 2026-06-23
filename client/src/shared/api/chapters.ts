import { api, unwrap } from "./_client";

export type ChapterStatus =
  | "DRAFT"
  | "IN_PRODUCTION"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED"
  | "ARCHIVED";
export type PageStatus =
  | "PENDING"
  | "UPLOADING"
  | "PROCESSING"
  | "UPLOADED"
  | "PROCESSING_FAILED"
  | "IN_TASK"
  | "READY_FOR_EDITOR"
  | "APPROVED"
  | "LOCKED";

export interface Chapter {
  id: string;
  seriesId: string;
  chapterNumber: number;
  title: string;
  status: ChapterStatus;
  publicationTypeSnapshot?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterPage {
  id: string;
  chapterId: string;
  pageNumber: number;
  status: PageStatus;
  originalFileAssetId?: string;
  workingFileAssetId?: string;
  thumbnailFileAssetId?: string;
  activeTask?: {
    id: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterInput {
  chapterNumber: number;
  title: string;
}

export interface ChapterReadinessItem {
  key: string;
  passed: boolean;
  reason: string;
}

export interface ChapterReadinessResult {
  chapterId: string;
  chapterStatus: string;
  ready: boolean;
  items: ChapterReadinessItem[];
}

export interface ChapterHandoffResult {
  chapter: Chapter;
  pages: number;
  tasks: number;
  pendingEditorReviews: number;
}

export const chaptersApi = {
  createChapter: async (seriesId: string, data: CreateChapterInput) =>
    api.post(`/series/${seriesId}/chapters`, data).then(unwrap<Chapter>),

  getChapter: async (chapterId: string) => api.get(`/chapters/${chapterId}`).then(unwrap<Chapter>),

  getChapterPages: async (chapterId: string) =>
    api.get(`/chapters/${chapterId}/pages`).then(unwrap<ChapterPage[]>),

  createPage: async (chapterId: string, data: { pageNumber: number }) =>
    api.post(`/chapters/${chapterId}/pages`, data).then(unwrap<ChapterPage>),

  deleteChapter: async (chapterId: string) => {
    const res = await api.delete(`/chapters/${chapterId}`);
    return res.data;
  },

  archiveChapter: async (chapterId: string) => {
    const res = await api.post(`/chapters/${chapterId}/cancel`);
    return res.data;
  },

  deletePage: async (chapterId: string, pageId: string) => {
    const res = await api.delete(`/chapters/${chapterId}/pages/${pageId}`);
    return res.data;
  },

  replacePage: async (chapterId: string, pageId: string, originalFileAssetId: string) => {
    const res = await api.put(`/chapters/${chapterId}/pages/${pageId}/replace`, {
      originalFileAssetId,
    });
    return res.data;
  },

  getChapterReadiness: async (chapterId: string) =>
    api.get(`/chapters/${chapterId}/readiness`).then(unwrap<ChapterReadinessResult>),

  markChapterReady: async (chapterId: string) =>
    api.post(`/chapters/${chapterId}/mark-ready`).then(unwrap<Chapter>),

  sendChapterToEditor: async (chapterId: string) =>
    api.post(`/chapters/${chapterId}/send-to-editor`).then(unwrap<ChapterHandoffResult>),
};
