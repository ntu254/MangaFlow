import { Platform } from "react-native"
import {
  DEFAULT_LEASE_MS,
  derivePreviewKind,
  resolveDisplayUrl,
  type FileUrlLease,
  type ReviewFile,
} from "@/domain/review-files"
import { getMobileApiBaseUrl } from "@/services/mobile-api-config"
import { mobileApi } from "@/services/mobile-api-client"

export type { FileUrlLease, ReviewFile } from "@/domain/review-files"

interface DisplayUrlPayload {
  url: string
  expiresAt?: string
}

// Authorization comes from the live session's bearer token via mobileApi —
// the backend derives role/permission from the actor, not from a request
// parameter, so there is no per-role token to select here.
export async function getReviewFiles(
  context: "proposal" | "chapter",
  id: string,
): Promise<ReviewFile[]> {
  const files = await mobileApi.request<ReviewFile[]>(
    `/review-files/${context}/${encodeURIComponent(id)}`,
  )

  return files.map((file) => ({
    ...file,
    previewKind: derivePreviewKind(file.mimeType, Platform.OS),
  }))
}

export async function openReviewFile(file: ReviewFile): Promise<FileUrlLease> {
  const payload = await mobileApi.request<DisplayUrlPayload>("/files/display-url", {
    method: "POST",
    body: JSON.stringify({ key: file.key, name: file.name, fileName: file.name }),
  })
  const serverExpiresAtMs = payload.expiresAt ? Date.parse(payload.expiresAt) : Number.NaN

  return {
    url: resolveDisplayUrl(payload.url, getMobileApiBaseUrl()),
    expiresAtMs: Number.isFinite(serverExpiresAtMs)
      ? serverExpiresAtMs
      : Date.now() + DEFAULT_LEASE_MS,
  }
}
