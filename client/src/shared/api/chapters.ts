import { api, unwrap } from "./_client";

export interface Chapter {
  id: string;
  seriesId: string;
  chapterNumber: number;
  title: string;
  status: string;
  publicationTypeSnapshot?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterPage {
  id: string;
  chapterId: string;
  pageNumber: number;
  status: string;
  originalFileAssetId?: string;
  workingFileAssetId?: string;
  thumbnailFileAssetId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterInput {
  chapterNumber: number;
  title: string;
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

  cancelChapter: async (chapterId: string) => {
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
};
