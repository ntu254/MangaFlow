import type { SeriesUploadContentType } from "@/api/series"

export interface CreateSeriesFormData {
  title: string
  genre: string
  audience: string
  publicationType: string
  tags: string[]
  synopsis: string
  logline: string
  premise: string
  characters: string
  conflict: string
}

export type UploadSlot =
  | "PROPOSAL_PDF"
  | "SAMPLE_PAGE"
  | "CHARACTER_CONCEPT"
  | "COVER_DRAFT"
  | "REFERENCE_IMAGE"
  | "WORLD_SETTING"

export interface UploadedSeriesFile {
  fileAssetId: string
  manuscriptId?: string
  originalName: string
  size: number
  contentType: SeriesUploadContentType
  slot: UploadSlot
}

export const UPLOAD_SLOT_LABELS: Record<UploadSlot, string> = {
  PROPOSAL_PDF: "Proposal Manuscript",
  SAMPLE_PAGE: "Sample Pages",
  CHARACTER_CONCEPT: "Character Concepts",
  COVER_DRAFT: "Cover Draft",
  REFERENCE_IMAGE: "Reference Images",
  WORLD_SETTING: "World / Setting",
}

export const initialFormData: CreateSeriesFormData = {
  title: "",
  genre: "",
  audience: "",
  publicationType: "WEEKLY",
  tags: [],
  synopsis: "",
  logline: "",
  premise: "",
  characters: "",
  conflict: "",
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
