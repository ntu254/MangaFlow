import type { Response } from "express";
import { asyncRoute } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";
import { readDisplayFile, writeLocalUpload } from "../application/file-access.application.js";

function setFileDisplayCorsHeaders(req: AuthedRequest, res: Response) {
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
  await writeLocalUpload(String(req.params.token ?? ""), req.body);
  res.status(204).end();
});

export const displayFile = asyncRoute(async (req: AuthedRequest, res) => {
  const file = await readDisplayFile(String(req.params.token ?? ""));

  setFileDisplayCorsHeaders(req, res);

  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Cache-Control", "private, max-age=300");

  if (file.fileName) {
    const safeFileName = file.fileName.replace(/["\r\n]/g, "");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
  }

  res.send(file.bytes);
});
