import cors from "cors";
import express from "express";
import { env } from "./config/env.config.js";
import { apiRouter } from "./routes/index.js";
import { fail } from "./shared/responses/api-response.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin
    })
  );
  app.use(express.json());

  app.use("/api", apiRouter);

  app.use((_req, res) => {
    res.status(404).json(fail("Route not found", "ROUTE_NOT_FOUND"));
  });

  return app;
}
