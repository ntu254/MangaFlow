import { apiRequest } from "@/shared/api/client"

export interface Chapter {
  id?: string
  _id?: string
  seriesId: string
  chapterNumber: number
  title: string
  status: string
  draftSchedule?: string
  createdAt: string
  updatedAt: string
}

export interface Page {
  id?: string
  _id?: string
  chapterId: string
  pageNumber: number
  status: string
  originalFileAssetId?: string
  variantFileAssetIds?: string[]
  regionIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface ChapterReadinessItem {
  key: string
  passed: boolean
  reason: string
}

export interface ChapterReadinessResponse {
  chapterId: string
  chapterStatus: string
  ready: boolean
  items: ChapterReadinessItem[]
}

export function getChapterReadiness(chapterId: string) {
  return apiRequest<ChapterReadinessResponse>(`/chapters/${chapterId}/readiness`)
}

export function listChaptersBySeries(seriesId: string) {
  return apiRequest<Chapter[]>(`/chapters/series/${seriesId}`)
}

export function listPagesByChapter(chapterId: string) {
  return apiRequest<Page[]>(`/chapters/${chapterId}/pages`)
}
