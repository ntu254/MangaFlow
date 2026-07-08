import type { NextFunction, RequestHandler, Response } from "express";
import { randomUUID } from "node:crypto";
import type { AuthedRequest, Envelope } from "../types.js";
import { logger } from "./logger.js";

export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code = "APP_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function ok<T>(res: Response, data: T, message?: string, status = 200) {
  const body: Envelope<T> = message ? { success: true, data, message } : { success: true, data };
  return res.status(status).json(body);
}

export function created<T>(res: Response, data: T, message = "Created") {
  return ok(res, data, message, 201);
}

export function requestId(req: AuthedRequest, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  req.requestId = incoming && incoming.trim() ? incoming : randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}

export function asyncRoute<T>(
  fn: (req: AuthedRequest, res: Response, next: NextFunction) => Promise<T>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req as AuthedRequest, res, next).catch(next);
  };
}

export function notFound(req: AuthedRequest, _res: Response, next: NextFunction) {
  next(new AppError(404, `No route for ${req.method} ${req.originalUrl}`, "NOT_FOUND"));
}

export function errorHandler(err: unknown, req: AuthedRequest, res: Response, _next: NextFunction) {
  const appError =
    err instanceof AppError
      ? err
      : err instanceof Error
        ? new AppError(500, err.message || "Unexpected server error", "INTERNAL_ERROR")
        : new AppError(500, "Unexpected server error", "INTERNAL_ERROR");

  if (appError.status >= 500) {
    logger.error("unhandled_error", {
      requestId: req.requestId,
      code: appError.code,
      message: appError.message,
      path: req.originalUrl,
      method: req.method,
    });
  }

  return res.status(appError.status).json({
    success: false,
    data: null,
    message: appError.status >= 500 ? "Unexpected server error" : appError.message,
    code: appError.code,
    requestId: req.requestId,
  });
}
