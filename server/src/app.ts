import cors from "cors";
import express from "express";
import { env } from "./config/env.config.js";
import { createApiRouter, type ApiRouterDependencies } from "./routes/index.js";
import { fail } from "./shared/responses/api-response.js";

export function createApp(dependencies: ApiRouterDependencies = {}) {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin
    })
  );
  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

  app.use("/api", createApiRouter(dependencies));

  app.use((_req, res) => {
    res.status(404).json(fail("Route not found", "ROUTE_NOT_FOUND"));
  });

  return app;
}
