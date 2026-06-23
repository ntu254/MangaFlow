import type { Request, Response } from "express"
import {
  approveChapterVersionService,
  createChapterReviewAnnotationService,
  getChapterVersionDetailService,
  listChapterReviewAnnotationsService,
  listChapterVersionsService,
  listEditorChapterReviewQueueService,
  patchChapterReviewAnnotationService,
  requestChapterVersionRevisionService,
  submitChapterVersionService,
} from "./chapter-review.service.js"

export async function submitChapterVersion(req: Request, res: Response): Promise<void> {
  const data = await submitChapterVersionService(String(req.params.chapterId), req.user!)
  res.status(201).json({ success: true, message: "Chapter version submitted for Editor review", data })
}

export async function listChapterVersions(req: Request, res: Response): Promise<void> {
  const data = await listChapterVersionsService(String(req.params.chapterId), req.user!)
  res.json({ success: true, message: "Chapter versions retrieved", data })
}

export async function getChapterVersionDetail(req: Request, res: Response): Promise<void> {
  const data = await getChapterVersionDetailService(String(req.params.versionId), req.user!)
  res.json({ success: true, message: "Chapter version detail retrieved", data })
}

export async function listEditorChapterReviewQueue(req: Request, res: Response): Promise<void> {
  const data = await listEditorChapterReviewQueueService(req.user!)
  res.json({ success: true, message: "Editor chapter review queue retrieved", data })
}

export async function requestChapterVersionRevision(req: Request, res: Response): Promise<void> {
  const data = await requestChapterVersionRevisionService({
    versionId: String(req.params.versionId),
    actor: req.user!,
    reviewerNote: req.body.reviewerNote,
  })
  res.json({ success: true, message: "Chapter version revision requested", data })
}

export async function approveChapterVersion(req: Request, res: Response): Promise<void> {
  const data = await approveChapterVersionService({
    versionId: String(req.params.versionId),
    actor: req.user!,
    reviewerNote: req.body.reviewerNote,
  })
  res.json({ success: true, message: "Chapter version approved and locked", data })
}

export async function listChapterReviewAnnotations(req: Request, res: Response): Promise<void> {
  const data = await listChapterReviewAnnotationsService(String(req.params.versionId), req.user!)
  res.json({ success: true, message: "Chapter review annotations retrieved", data })
}

export async function createChapterReviewAnnotation(req: Request, res: Response): Promise<void> {
  const data = await createChapterReviewAnnotationService({
    versionId: String(req.params.versionId),
    actor: req.user!,
    pageId: req.body.pageId,
    body: req.body.body,
    geometry: req.body.geometry,
    isBlocking: req.body.isBlocking,
  })
  res.status(201).json({ success: true, message: "Chapter review annotation created", data })
}

export async function patchChapterReviewAnnotation(req: Request, res: Response): Promise<void> {
  const data = await patchChapterReviewAnnotationService({
    annotationId: String(req.params.annotationId),
    actor: req.user!,
    body: req.body.body,
    geometry: req.body.geometry,
    isBlocking: req.body.isBlocking,
    status: req.body.status,
  })
  res.json({ success: true, message: "Chapter review annotation updated", data })
}
