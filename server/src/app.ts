import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.config.js";
import { createApiRouter, type ApiRouterDependencies } from "./routes/index.js";
import { fail } from "./shared/responses/api-response.js";
import openapiSpec from "./docs/openapi.json" with { type: "json" };

export function createApp(dependencies: ApiRouterDependencies = {}) {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.get("/api/docs.json", (_req, res) => {
    res.json(openapiSpec);
  });

  app.use("/api", createApiRouter(dependencies));

  app.use((_req, res) => {
    res.status(404).json(fail("Route not found", "ROUTE_NOT_FOUND"));
  });

  return app;
}
