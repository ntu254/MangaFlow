import { api } from "./_client";

export const regionsApi = {
  // TODO: Migrate these routes from /api/files/... to /api/pages/... and /api/regions/...
  createRegion: async (pageId: string, payload: any) => {
    const res = await api.post(`/files/pages/${pageId}/regions`, payload);
    return res.data;
  },

  updateRegion: async (regionId: string, payload: any) => {
    const res = await api.patch(`/files/regions/${regionId}`, payload);
    return res.data;
  },

  deleteRegion: async (regionId: string) => {
    const res = await api.delete(`/files/regions/${regionId}`);
    return res.data;
  },
};
