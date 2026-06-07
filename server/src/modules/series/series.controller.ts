import type { NextFunction, Request, Response } from "express";
import { createSeriesService, submitSeriesService } from "./series.service.js";

export async function createSeries(
  req: Request & { user?: { userId: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const series = await createSeriesService({
    ...req.body,
    ownerId: req.user!.userId,
  });

  res.status(201).json({
    success: true,
    message: "Series created successfully",
    data: series,
  });
}

export async function submitSeries(
  req: Request & { user?: { userId: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const seriesId = String(req.params.seriesId);
  const series = await submitSeriesService(seriesId, req.user!.userId);

  res.json({
    success: true,
    message: "Series submitted for editor review",
    data: series,
  });
}
