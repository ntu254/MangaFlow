import { api } from "./_client";

export const filesApi = {
  getPresignedUploadUrl: async (originalName: string, contentType: string) => {
    const res = await api.post("/files/presigned-upload", { originalName, contentType });
    return res.data;
  },

  confirmPageUpload: async (
    pageId: string,
    payload: {
      original: any;
      working: any;
      thumbnail: any;
    }
  ) => {
    const res = await api.post(`/files/pages/${pageId}/confirm-upload`, payload);
    return res.data;
  },

  getPresignedDownloadUrl: async (fileAssetId: string) => {
    const res = await api.get(`/files/${fileAssetId}/presigned-download`);
    return res.data;
  },


};
