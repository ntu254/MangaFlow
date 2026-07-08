import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFound, ok, requestId } from "./lib/http.js";
import { logger } from "./lib/logger.js";
import { createApiRouter } from "./routes/index.js";
import mongoose from "mongoose";

export type AppOptions = {
  aiServiceUrl?: string;
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(requestId as express.RequestHandler);

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
      logger[level]("request", {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration,
        requestId: (req as any).requestId,
      });
    });
    next();
  });

  app.get("/health", (_req, res) => ok(res, { status: "ok", service: "mangaflow-backend" }));

  app.get("/ready", async (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const ready = dbState === 1;
    if (!ready) {
      logger.warn("readiness_check_failed", { dbState });
    }
    return res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      db: ready ? "connected" : "disconnected",
      service: "mangaflow-backend",
    });
  });

  app.use(
    "/api",
    createApiRouter({ aiServiceUrl: options.aiServiceUrl ?? env.AI_SERVICE_URL })
  );

  app.use(notFound as express.RequestHandler);
  app.use(errorHandler as express.ErrorRequestHandler);
  return app;
}
