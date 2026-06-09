import type { ActionItem } from "@/shared/components/domain"
import { StatusBadge } from "@/shared/components/domain"
import type { MFTableColumn } from "@/shared/components/ui"
import { chapterStatusUI, taskStatusUI } from "@/shared/lib/status-ui"
import type { Chapter } from "@/features/chapter/api/chapter.api"

export interface ChapterRow {
  id: string
  title: string
  number: string
  status: string
  schedule: string
  updatedAt: string
}

export const CHAPTER_READY_STATUSES = new Set(["APPROVED", "ONGOING", "AT_RISK"])

export const seriesDetailActions: ActionItem[] = [
  { id: "series-action-1", title: "Chapter list connected", description: "Series Detail now loads live chapter rows from the backend.", metadata: "GET /api/chapters/series/:seriesId", icon: "menu_book", status: "IN_PROGRESS" },
  { id: "series-action-2", title: "Chapter creation remains gated", description: "Backend Board approval remains the source of truth.", metadata: "No chapter mutation here", icon: "lock", status: "REVISION_REQUESTED" },
]

export const chapterColumns: MFTableColumn<ChapterRow>[] = [
  { id: "chapter", header: "Chapter", cell: (chapter) => <div><p className="break-words text-label-md text-on-surface">{chapter.title}</p><p className="mt-xs text-label-sm text-on-surface-muted">{chapter.number}</p></div> },
  { id: "status", header: "Status", cell: (chapter) => <StatusBadge status={chapter.status} mapping={chapterStatusUI} /> },
  { id: "schedule", header: "Schedule", cell: (chapter) => chapter.schedule },
  { id: "updated", header: "Updated", cell: (chapter) => chapter.updatedAt },
]

export function chapterId(chapter: Chapter) {
  return chapter.id ?? chapter._id ?? `${chapter.seriesId}-${chapter.chapterNumber}`
}

export function toChapterRows(chapters: Chapter[]): ChapterRow[] {
  return chapters.map((chapter) => ({
    id: chapterId(chapter),
    title: chapter.title,
    number: `Chapter ${chapter.chapterNumber}`,
    status: chapter.status,
    schedule: chapter.draftSchedule ? new Date(chapter.draftSchedule).toLocaleDateString() : "Not scheduled",
    updatedAt: new Date(chapter.updatedAt).toLocaleDateString(),
  }))
}

export { taskStatusUI }
