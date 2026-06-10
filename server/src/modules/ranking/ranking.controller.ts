import type { Request, Response } from "express"
import { finalizeRankingService, importRankingService, listMangakaRankingsService, listRankingsService } from "./ranking.service.js"


export async function listRankings(_req: Request, res: Response): Promise<void> {
  const rankings = await listRankingsService()
  res.json({ success: true, message: "Rankings retrieved", data: rankings })
}

export async function importRanking(req: Request, res: Response): Promise<void> {
  const ranking = await importRankingService(req.body)
  res.status(201).json({ success: true, message: "Ranking imported", data: ranking })
}

export async function finalizeRanking(req: Request, res: Response): Promise<void> {
  const ranking = await finalizeRankingService(String(req.params.rankingId))
  res.json({ success: true, message: "Ranking finalized", data: ranking })
}


export async function listMangakaRankings(req: Request, res: Response): Promise<void> {
  const rankings = await listMangakaRankingsService(String(req.user!.userId))
  res.json({ success: true, message: "Mangaka rankings retrieved", data: rankings })
}
