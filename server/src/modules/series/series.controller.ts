import type { NextFunction, Request, Response } from "express"
import { createSeriesProposal, submitSeriesProposal } from "./series.service.js"
import type { CreateSeriesInput } from "./series.validation.js"

export async function createSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" })
      return
    }

    const series = await createSeriesProposal(req.body as CreateSeriesInput, req.user.userId)

    res.status(201).json({
      success: true,
      message: "Series created successfully",
      data: series,
    })
  } catch (err) {
    next(err)
  }
}

export async function submitSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" })
      return
    }

    const seriesId = String(req.params.seriesId)
    const series = await submitSeriesProposal(seriesId, req.user.userId)

    res.json({
      success: true,
      message: "Series submitted for editor review",
      data: series,
    })
  } catch (err) {
    next(err)
  }
}
