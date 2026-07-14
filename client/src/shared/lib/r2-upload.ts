// R2 File Upload Helper (canonical, MF-032)
//
// Wraps the backend presigned-upload/download endpoints exposed under
// `/api/files/*`. `apiRequest` already prefixes the API base URL with `/api`,
// so paths here must NOT include the `/api` prefix.
//
// Upload flow:
//   1. POST /files/presign-upload  -> { key, uploadUrl, downloadUrl, publicUrl, method, headers, persistent, storage }
//   2. PUT the file bytes to uploadUrl (skipped for metadata-only fallback)
//   3. Caller persists the returned canonical metadata via the relevant
//      entity API (submissions, chapter pages, proposal assets). There is no
//      separate backend "commit" endpoint.

import { apiRequest } from "../api/client";

export type UploadedFileMetadata = {
  /** Stable storage key persisted on the entity record. */
  fileKey: string;
  /** Stable URL for preview/download (public URL or presigned download URL). */
  url: string;
  /** Alias of `url` for call sites that expect `fileUrl`. */
  fileUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  sizeKB: number;
  persistent: boolean;
  storage: "r2" | "metadata-only";
};

export type R2UploadTarget = "submission" | "chapter-page" | "generic";

export interface PresignUploadResponse {
  key: string;
  uploadUrl: string;
  downloadUrl: string;
  publicUrl?: string;
  method: "PUT";
  headers?: Record<string, string>;
  persistent: boolean;
  storage: "r2" | "metadata-only";
}

export interface PresignDownloadResponse {
  key: string;
  downloadUrl: string;
  publicUrl?: string;
  persistent: boolean;
  storage?: "r2" | "metadata-only";
}

export interface R2UploadOptions {
  /** Storage folder. When omitted, derived from `target`/`entityId`. */
  folder?: string;
  /** High-level target used only locally to derive a default folder. */
  target?: R2UploadTarget;
  /** Owning entity id used only locally to derive a default folder. */
  entityId?: string;
  onProgress?: (progress: number) => void;
  validateFile?: (file: File) => { valid: boolean; error?: string };
}

function defaultFolder(options: R2UploadOptions): string | undefined {
  if (options.folder) return options.folder;
  if (!options.target) return undefined;
  const id = options.entityId ? `/${options.entityId}` : "";
  switch (options.target) {
    case "submission":
      return `submissions${id}`;
    case "chapter-page":
      return `chapters${id}/pages`;
    default:
      return undefined;
  }
}

/** Request a presigned upload target from the backend. */
export async function presignR2Upload(input: {
  fileName: string;
  contentType: string;
  folder?: string;
}): Promise<PresignUploadResponse> {
  // Backend only supports fileName, contentType, folder.
  return apiRequest<PresignUploadResponse>("/files/presign-upload", {
    method: "POST",
    body: {
      fileName: input.fileName,
      contentType: input.contentType,
      folder: input.folder,
    },
    auth: true,
  });
}

/** Request a presigned (or public) download URL for a stored key. */
export async function presignR2Download(fileKey: string): Promise<PresignDownloadResponse> {
  return apiRequest<PresignDownloadResponse>("/files/presign-download", {
    method: "POST",
    body: { key: fileKey },
    auth: true,
  });
}

/**
 * Resolve a stable download/preview URL for a stored file key.
 * Prefers a backend public URL, otherwise a presigned download URL.
 * Never returns a private bucket URL directly.
 */
export async function getPresignedDownloadUrl(fileKey: string): Promise<string> {
  const res = await presignR2Download(fileKey);
  return res.publicUrl ?? res.downloadUrl;
}

/**
 * Upload a file to R2 and return canonical metadata.
 * No mock fallback: a failed PUT rejects.
 */
export async function uploadFileToR2(
  file: File,
  options: R2UploadOptions = {},
): Promise<UploadedFileMetadata> {
  if (options.validateFile) {
    const validation = options.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || "File validation failed");
    }
  }

  const contentType = file.type || "application/octet-stream";
  const signed = await presignR2Upload({
    fileName: file.name,
    contentType,
    folder: defaultFolder(options),
  });

  // metadata-only fallback (no R2 credentials configured): skip the PUT but
  // still return a stable key + url so records persist server-side.
  if (!signed.uploadUrl.startsWith("metadata://")) {
    await putFileToR2(file, signed, contentType, options.onProgress);
  }

  const url = signed.publicUrl ?? signed.downloadUrl;
  return {
    fileKey: signed.key,
    url,
    fileUrl: url,
    filename: file.name,
    mimeType: contentType,
    size: file.size,
    sizeKB: Math.round(file.size / 1024),
    persistent: signed.persistent,
    storage: signed.storage,
  };
}

function putFileToR2(
  file: File,
  signed: PresignUploadResponse,
  contentType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(signed.method, signed.uploadUrl, true);
    const headers = signed.headers ?? { "content-type": contentType };
    for (const [name, value] of Object.entries(headers)) {
      xhr.setRequestHeader(name, value);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
