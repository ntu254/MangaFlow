export type ReviewPreviewKind = "image" | "pdf" | "external";

export interface ReviewFile {
  id: string;
  key: string;
  name: string;
  mimeType: string;
  size: number | null;
  version?: string;
  submittedAt?: string;
  submittedBy?: string;
  previewKind: ReviewPreviewKind;
}

export interface FileUrlLease {
  url: string;
  expiresAtMs: number;
}

export const DEFAULT_LEASE_MS = 8 * 60 * 1000;
export const REFRESH_SKEW_MS = 30 * 1000;

export function derivePreviewKind(mimeType: string): ReviewPreviewKind {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  if (normalizedMimeType.startsWith("image/")) return "image";
  if (normalizedMimeType === "application/pdf") return "pdf";
  return "external";
}

export function shouldRefreshLease(lease: FileUrlLease | null, nowMs: number): boolean {
  return !lease || nowMs >= lease.expiresAtMs - REFRESH_SKEW_MS;
}
