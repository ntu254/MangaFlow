import { apiRequest } from "./client";
import type { PresignedUpload, FileDisplayUrl } from "./services";

// Auth-002 — every presign-download call now ships a (resourceType, resourceId)
// tuple so the backend can resolve ownership without brute-forcing every owner
// collection. Callers that still need the legacy "key only" path can fall back
// to `presignDownloadKeyOnly`.
export type PresignDownloadBody = {
  key: string;
  resourceType?: "PAGE" | "CHAPTER" | "SERIES" | "PROPOSAL" | "MATERIAL" | "SUBMISSION";
  resourceId?: string;
  fileName?: string;
};

export const filesApi = {
  presignUpload: (body: { fileName: string; contentType?: string; folder?: string }) =>
    apiRequest<PresignedUpload>("/files/presign-upload", { method: "POST", body }),
  presignDownload: (body: PresignDownloadBody) =>
    apiRequest<{ key: string; downloadUrl: string; publicUrl?: string; persistent: boolean }>(
      "/files/presign-download",
      { method: "POST", body },
    ),
  /**
   * @deprecated prefer `presignDownload` with resourceType+resourceId. Kept for
   * compatibility with callers that don't yet know which resource owns the key
   * — the backend will fall back to the legacy brute-force search.
   */
  presignDownloadKeyOnly: (key: string) =>
    filesApi.presignDownload({ key }),
  displayUrl: (body: PresignDownloadBody) =>
    apiRequest<FileDisplayUrl>("/files/display-url", { method: "POST", body }),
  /**
   * @deprecated prefer `displayUrl` with resourceType+resourceId.
   */
  displayUrlKeyOnly: (body: { key: string; fileName?: string }) =>
    filesApi.displayUrl({ key: body.key, fileName: body.fileName }),
};

export const assistantAiApi = {
  health: () => apiRequest("/ai/health"),
  detectBubbles: (formData: FormData) =>
    apiRequest("/ai/bubbles/detect", { method: "POST", body: formData }),
  processBubbles: (formData: FormData) =>
    apiRequest("/ai/bubbles/process", { method: "POST", body: formData }),
  detectPageBubbles: (pageId: string) =>
    apiRequest<{ pageId: string; processingId: string; regions: unknown[] }>(
      `/studio/pages/${pageId}/ai/detect-bubbles`,
      { method: "POST", body: {} },
    ),
  whitenPageBubbles: (pageId: string) =>
    apiRequest<{
      pageId: string;
      processingId: string;
      fileKey: string;
      fileUrl: string;
      metadata: Record<string, unknown>;
    }>(`/studio/pages/${pageId}/ai/whiten-bubbles`, { method: "POST", body: {} }),
};
