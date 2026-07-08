import path from "node:path";
import { asyncRoute, AppError } from "../lib/http.js";
import {
  putLocalObject,
  readStoredObject,
  verifyFileAccessToken,
} from "../services/file-access.service.js";
import type { AuthedRequest } from "../types.js";

function contentTypeFor(key: string, fallback?: string) {
  if (fallback) return fallback;
  const ext = path.extname(key).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function setFileDisplayCorsHeaders(req: AuthedRequest, res: Parameters<Parameters<typeof asyncRoute>[0]>[1]) {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = process.env.CLIENT_URL ?? "http://localhost:5173";

  // Signed display URLs are already protected by token, so the file response may be embedded by the frontend origin.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Vary", "Origin");

  if (requestOrigin && requestOrigin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  }
}

export const putLocalUpload = asyncRoute(async (req: AuthedRequest, res) => {
  const token = String(req.params.token ?? "");
  const payload = verifyFileAccessToken(token);

  if (!Buffer.isBuffer(req.body)) {
    throw new AppError(400, "Upload body is required.", "VALIDATION_ERROR");
  }

  await putLocalObject(payload.key, req.body);
  res.status(204).end();
});

export const displayFile = asyncRoute(async (req: AuthedRequest, res) => {
  const token = String(req.params.token ?? "");
  const payload = verifyFileAccessToken(token);
  const bytes = await readStoredObject(payload.key);

  setFileDisplayCorsHeaders(req, res);

  res.setHeader("Content-Type", contentTypeFor(payload.key, payload.contentType));
  res.setHeader("Cache-Control", "private, max-age=300");

  if (payload.fileName) {
    const safeFileName = payload.fileName.replace(/["\r\n]/g, "");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
  }

  res.send(bytes);
});