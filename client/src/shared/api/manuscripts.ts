import { api, unwrap } from "./_client";

export interface ManuscriptFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  category?: string;
  uploadedAt?: string;
}

/**
 * Upload a manuscript file to a series draft.
 *
 * TODO: backend endpoint `POST /series/:id/manuscripts` may not exist yet.
 * If the request fails with a 404, the caller (`useUploadManuscript`)
 * gracefully falls back to a client-side mock so the UX still works end-to-end.
 */
export const manuscriptsApi = {
  list: (seriesId: string) =>
    api.get(`/series/${seriesId}/manuscripts`).then(unwrap<ManuscriptFile[]>),

  getDownloadUrl: (seriesId: string, fileAssetId: string) =>
    api
      .get(`/series/${seriesId}/manuscripts/files/${fileAssetId}/download`)
      .then(unwrap<{ downloadUrl: string; expiresIn: number }>),

  deleteFile: (seriesId: string, fileAssetId: string) =>
    api.delete(`/series/${seriesId}/manuscripts/files/${fileAssetId}`).then(unwrap<null>),

  verifyFiles: (seriesId: string) =>
    api
      .post(`/series/${seriesId}/manuscripts/files/verify`)
      .then(unwrap<{ id: string; status: string }[]>),

  upload: async (
    seriesId: string,
    file: File,
    onProgress?: (pct: number) => void,
    category?: string,
  ): Promise<ManuscriptFile> => {
    // 1. Get presigned URL and draft records
    const res = await api
      .post(`/series/${seriesId}/manuscripts/uploads`, {
        originalName: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        assetType: ["COVER_DRAFT", "CHARACTER_CONCEPT", "REFERENCE_IMAGE", "OTHER"].includes(
          category || "",
        )
          ? "SUPPORTING"
          : "MANUSCRIPT",
        slot: category,
      })
      .then(unwrap<any>);

    const { uploadUrl, fileAssetId, manuscriptId } = res;

    // 2. Upload file directly to R2 via XHR
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });

    return {
      id: manuscriptId || fileAssetId || `local-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      url: "", // We still rely on the local objectUrl from the caller for immediate preview
      category,
      uploadedAt: new Date().toISOString(),
    };
  },

  remove: (seriesId: string, fileId: string) =>
    api.delete(`/series/${seriesId}/manuscripts/${fileId}`).then(unwrap<void>),
};
