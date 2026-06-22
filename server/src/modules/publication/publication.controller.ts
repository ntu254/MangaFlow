import type { Request, Response } from "express"
import { cancelPublicationService, createPublicationService, listPublicationsService, patchPublicationService, publishPublicationService, schedulePublicationService } from "./publication.service.js"

export async function listPublications(req: Request, res: Response): Promise<void> {
  const seriesId = typeof req.query.seriesId === "string" ? req.query.seriesId : undefined
  const publications = await listPublicationsService({ seriesId }, req.user!)
  res.json({ success: true, message: "Publications retrieved", data: publications })
}

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

export async function patchPublication(req: Request, res: Response): Promise<void> {
  const publication = await patchPublicationService({
    publicationId: String(req.params.publicationId),
    scheduledFor: req.body.scheduledFor,
    actor: req.user!,
  })
  res.json({ success: true, message: "Publication updated", data: publication })
}

export async function cancelPublication(req: Request, res: Response): Promise<void> {
  const publication = await cancelPublicationService({
    publicationId: String(req.params.publicationId),
    actor: req.user!,
  })
  res.json({ success: true, message: "Publication cancelled", data: publication })
}
