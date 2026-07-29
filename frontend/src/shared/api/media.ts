import { apiRequest } from "./client";
import type { PresignedUpload, FileDisplayUrl } from "./services";

export const filesApi = {
  presignUpload: (body: { fileName: string; contentType?: string; folder?: string }) =>
    apiRequest<PresignedUpload>("/files/presign-upload", { method: "POST", body }),
  presignDownload: (key: string) =>
    apiRequest<{ key: string; downloadUrl: string; publicUrl?: string; persistent: boolean }>(
      "/files/presign-download",
      { method: "POST", body: { key } },
    ),
  displayUrl: (body: { key: string; fileName?: string }) =>
    apiRequest<FileDisplayUrl>("/files/display-url", { method: "POST", body }),
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
