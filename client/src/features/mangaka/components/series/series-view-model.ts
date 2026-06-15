import type { SeriesDraft } from "@/api/series"

export type SeriesDisplayStatus =
  | "Draft"
  | "Editor Review"
  | "Revision Requested"
  | "Board Review"
  | "Approved"
  | "In Production"
  | "At Risk"
  | "Rejected"
  | "Cancelled"
  | "Completed"

export interface SeriesViewModel {
  id: string
  title: string
  type: string
  genres: string[]
  description: string
  status: SeriesDisplayStatus
  chapters: number
  pages: number
  totalPages: number
  progress: number
  nextMilestone: {
    name: string
  }
  updatedAt: string
  updatedAtTimestamp: number
}

const statusLabels: Record<string, SeriesDisplayStatus> = {
  DRAFT: "Draft",
  EDITOR_REVIEW: "Editor Review",
  REVISION_REQUESTED: "Revision Requested",
  BOARD_REVIEW: "Board Review",
  APPROVED: "Approved",
  ONGOING: "In Production",
  AT_RISK: "At Risk",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
}

const nextActions: Record<SeriesDisplayStatus, string> = {
  Draft: "Continue series proposal",
  "Editor Review": "View editor review",
  "Revision Requested": "Address requested revisions",
  "Board Review": "View board review",
  Approved: "Prepare series production",
  "In Production": "Open production workspace",
  "At Risk": "Review attention items",
  Rejected: "View decision",
  Cancelled: "View series details",
  Completed: "View completed series",
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function toSeriesViewModel(series: SeriesDraft): SeriesViewModel {
  const status = statusLabels[series.status] ?? "Draft"

  return {
    id: series.id,
    title: series.title,
    type: series.publicationType?.trim() || "Manga Series",
    genres: series.genres ?? [],
    description: series.synopsis,
    status,
    chapters: 0,
    pages: 0,
    totalPages: 0,
    progress: 0,
    nextMilestone: { name: nextActions[status] },
    updatedAt: formatUpdatedAt(series.updatedAt),
    updatedAtTimestamp: Date.parse(series.updatedAt) || 0,
  }
}
