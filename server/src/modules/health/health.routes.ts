import { Router } from "express";
import { ok } from "../../shared/responses/api-response.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json(
    ok({
      service: "mangaflow-api",
      status: "healthy",
      timestamp: new Date().toISOString()
    })
  );
});
