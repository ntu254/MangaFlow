import type { Request, Response } from "express"
import { createPublicationService, publishPublicationService, schedulePublicationService } from "./publication.service.js"

export async function createPublication(req: Request, res: Response): Promise<void> {
  const publication = await createPublicationService({
    chapterId: req.body.chapterId,
    scheduledFor: req.body.scheduledFor,
    actor: req.user!,
  })
  res.status(201).json({ success: true, message: "Publication created", data: publication })
}

export async function schedulePublication(req: Request, res: Response): Promise<void> {
  const publication = await schedulePublicationService({
    publicationId: String(req.params.publicationId),
    scheduledFor: req.body.scheduledFor,
    actor: req.user!,
  })
  res.json({ success: true, message: "Publication scheduled", data: publication })
}

export async function publishPublication(req: Request, res: Response): Promise<void> {
  const publication = await publishPublicationService(String(req.params.publicationId), req.user!)
  res.json({ success: true, message: "Publication published", data: publication })
}
