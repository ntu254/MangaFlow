import { apiRequest } from "@/shared/api/client"

export interface PublicationRecord {
  id: string
  chapterId: string
  seriesId: string
  scheduledFor?: string
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

export function createPublication(chapterId: string, scheduledFor?: string) {
  return apiRequest<PublicationRecord>("/publications", {
    method: "POST",
    body: JSON.stringify({ chapterId, scheduledFor }),
  })
}

export function schedulePublication(publicationId: string, scheduledFor: string) {
  return apiRequest<PublicationRecord>(`/publications/${publicationId}/schedule`, {
    method: "POST",
    body: JSON.stringify({ scheduledFor }),
  })
}

export function publishPublication(publicationId: string) {
  return apiRequest<PublicationRecord>(`/publications/${publicationId}/publish`, {
    method: "POST",
  })
}
