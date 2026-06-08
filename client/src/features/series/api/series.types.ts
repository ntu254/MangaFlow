export type SeriesStatus =
  | "DRAFT"
  | "EDITOR_REVIEW"
  | "REVISION_REQUESTED"
  | "BOARD_REVIEW"
  | "APPROVED"
  | "ONGOING"
  | "AT_RISK"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"

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
