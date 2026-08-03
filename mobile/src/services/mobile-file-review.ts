import {
  DEFAULT_LEASE_MS,
  derivePreviewKind,
  resolveDisplayUrl,
  type FileUrlLease,
  type ReviewFile,
} from "@/domain/review-files";
import { getMobileApiBaseUrl } from "@/services/mobile-api-config";
import {
  getMobileWorkflowAccessToken,
  type MobileApiRole,
} from "@/services/mobile-workflow-data-source";

export type { FileUrlLease, ReviewFile } from "@/domain/review-files";
export type { MobileApiRole } from "@/services/mobile-workflow-data-source";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface DisplayUrlPayload {
  url: string;
  expiresAt?: string;
}

export class MobileFileReviewHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "MobileFileReviewHttpError";
  }
}

async function reviewFileRequest<T>(
  path: string,
  role: MobileApiRole,
  init?: RequestInit,
): Promise<T> {
  const token = await getMobileWorkflowAccessToken(role);
  const response = await fetch(`${getMobileApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Mobile file review ${path} failed with ${response.status}`;
    try {
      const error = (await response.json()) as { message?: string };
      if (error.message) message = error.message;
    } catch {
      // Keep the status-bearing fallback when an error body is unavailable.
    }
    throw new MobileFileReviewHttpError(response.status, message);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
}

export async function getReviewFiles(
  context: "proposal" | "chapter",
  id: string,
  role: MobileApiRole,
): Promise<ReviewFile[]> {
  const files = await reviewFileRequest<ReviewFile[]>(
    `/review-files/${context}/${encodeURIComponent(id)}`,
    role,
  );

  return files.map((file) => ({
    ...file,
    previewKind: derivePreviewKind(file.mimeType),
  }));
}

export async function openReviewFile(file: ReviewFile, role: MobileApiRole): Promise<FileUrlLease> {
  const payload = await reviewFileRequest<DisplayUrlPayload>("/files/display-url", role, {
    method: "POST",
    body: JSON.stringify({ key: file.key, name: file.name, fileName: file.name }),
  });
  const serverExpiresAtMs = payload.expiresAt ? Date.parse(payload.expiresAt) : Number.NaN;

  return {
    url: resolveDisplayUrl(payload.url, getMobileApiBaseUrl()),
    expiresAtMs: Number.isFinite(serverExpiresAtMs)
      ? serverExpiresAtMs
      : Date.now() + DEFAULT_LEASE_MS,
  };
}
