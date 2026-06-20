import { api } from "./_client";

export const chaptersApi = {
  getChapterPages: async (chapterId: string) => {
    const res = await api.get(`/chapters/${chapterId}/pages`);
    return res.data;
  },

  createPage: async (chapterId: string, data: { pageNumber: number }) => {
    const res = await api.post(`/chapters/${chapterId}/pages`, data);
    return res.data;
  },

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
