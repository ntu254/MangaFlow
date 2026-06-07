export type SeriesStatus =
  | "DRAFT"
  | "EDITOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ONGOING"
  | "AT_RISK"

export interface Series {
  id: string
  title: string
  slug: string
  synopsis: string
  genres: string[]
  ownerId: string
  status: SeriesStatus
  createdAt: string
  updatedAt: string
}

export interface CreateSeriesInput {
  title: string
  synopsis: string
  genres: string[]
}
