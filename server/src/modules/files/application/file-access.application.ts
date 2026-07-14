import path from "node:path";
import { AppError } from "../../../lib/http.js";
import {
  createDisplayUrl,
  createLocalUploadUrl,
  putLocalObject,
  readStoredObject,
  verifyFileAccessToken,
} from "../../../services/file-access.service.js";
import { presignR2Download, presignR2Upload } from "../../../services/r2.service.js";
import { assertFileKeyVisible } from "../../../services/studio-access.service.js";
import type { RequestActor } from "../../../types.js";

const ALLOWED_UPLOAD_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

function isAllowedUploadContentType(contentType?: string) {
  if (!contentType) return true;
  return contentType.startsWith("image/") || ALLOWED_UPLOAD_CONTENT_TYPES.has(contentType);
}

export async function createPresignedUpload(input: {
  fileName?: unknown;
  contentType?: unknown;
  fileType?: unknown;
  folder?: unknown;
}) {
  const fileName = String(input.fileName ?? "page.png");
  const contentType =
    typeof input.contentType === "string"
      ? input.contentType
      : typeof input.fileType === "string"
        ? input.fileType
        : undefined;

  if (!isAllowedUploadContentType(contentType)) {
    throw new AppError(
      400,
      "Only image, PDF, and ZIP uploads are supported.",
      "UNSUPPORTED_FILE_TYPE",
    );
  }

  const folder = typeof input.folder === "string" ? input.folder : undefined;
  const signed = await presignR2Upload({ fileName, contentType, folder });

  if (signed.storage === "metadata-only" || process.env.VITEST) {
    return {
      ...signed,
      uploadUrl: createLocalUploadUrl(signed.key, contentType, fileName),
      downloadUrl: createDisplayUrl(signed.key, fileName).url,
      persistent: true,
      storage: "local" as const,
    };
  }

  return signed;
}

export async function createPresignedDownload(actor: RequestActor, key: unknown) {
  if (!key) throw new AppError(400, "key is required.", "VALIDATION_ERROR");
  await assertFileKeyVisible(actor, String(key));
  return presignR2Download(String(key));
}

export async function createSignedDisplayUrl(input: {
  actor: RequestActor;
  key: unknown;
  fileName?: unknown;
}) {
  if (!input.key) throw new AppError(400, "key is required.", "VALIDATION_ERROR");
  await assertFileKeyVisible(input.actor, String(input.key));
  return createDisplayUrl(
    String(input.key),
    typeof input.fileName === "string" ? input.fileName : undefined,
  );
}

export async function writeLocalUpload(token: string, body: unknown) {
  const payload = verifyFileAccessToken(token);

  if (!Buffer.isBuffer(body)) {
    throw new AppError(400, "Upload body is required.", "VALIDATION_ERROR");
  }

  await putLocalObject(payload.key, body);
}

export async function readDisplayFile(token: string) {
  const payload = verifyFileAccessToken(token);
  const bytes = await readStoredObject(payload.key);

  return {
    bytes,
    contentType: contentTypeFor(payload.key, payload.contentType),
    fileName: payload.fileName,
  };
}

function contentTypeFor(key: string, fallback?: string) {
  if (fallback) return fallback;
  const ext = path.extname(key).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}
