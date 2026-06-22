import { api, unwrap } from "./_client";

export interface PresignedUpload {
  uploadUrl: string;
  fileAssetId: string;
  r2Key: string;
  expiresIn: number;
}

export interface PresignedDownload {
  downloadUrl: string;
  expiresIn: number;
}

export interface UploadAssetPayload {
  fileAssetId: string;
  r2Key: string;
  originalName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  size: number;
}

export interface PresignedUploadScope {
  chapterId?: string;
  pageId?: string;
}

export const filesApi = {
  getPresignedUploadUrl: async (
    originalName: string,
    contentType: string,
    scope?: PresignedUploadScope,
  ) =>
    api
      .post("/files/presigned-upload", { originalName, contentType, ...scope })
      .then(unwrap<PresignedUpload>),

  confirmPageUpload: async (
    pageId: string,
    payload: {
      original: UploadAssetPayload;
      working: UploadAssetPayload;
      thumbnail: UploadAssetPayload;
    },
  ) => api.post(`/files/pages/${pageId}/confirm-upload`, payload).then(unwrap<unknown>),

  getPresignedDownloadUrl: async (fileAssetId: string) =>
    api.get(`/files/${fileAssetId}/presigned-download`).then(unwrap<PresignedDownload>),

  getFileContentBlob: async (fileAssetId: string) =>
    api
      .get<Blob>(`/files/${fileAssetId}/content`, { responseType: "blob" })
      .then((res) => res.data),
};
