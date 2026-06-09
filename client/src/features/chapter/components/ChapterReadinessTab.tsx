import { ChapterReadinessPanel } from "./ChapterDetailPanels"
import type { useChapterDetail } from "../hooks/useChapterDetail"

type ChapterDetailState = ReturnType<typeof useChapterDetail>

interface ChapterReadinessTabProps {
  chapter: Pick<
    ChapterDetailState,
    | "readinessLoading"
    | "readinessItems"
    | "readinessMessage"
    | "readinessSummaryTone"
    | "publicationActionLoading"
    | "publicationMessage"
    | "scheduleInput"
    | "setScheduleInput"
    | "handleCreatePublication"
    | "handleSchedulePublication"
    | "handlePublishPublication"
  >
}

export function ChapterReadinessTab({ chapter }: ChapterReadinessTabProps) {
  return (
    <ChapterReadinessPanel
      readinessLoading={chapter.readinessLoading}
      readinessItems={chapter.readinessItems}
      readinessMessage={chapter.readinessMessage}
      readinessSummaryTone={chapter.readinessSummaryTone}
      publicationActionLoading={chapter.publicationActionLoading}
      publicationMessage={chapter.publicationMessage}
      scheduleInput={chapter.scheduleInput}
      setScheduleInput={chapter.setScheduleInput}
      handleCreatePublication={chapter.handleCreatePublication}
      handleSchedulePublication={chapter.handleSchedulePublication}
      handlePublishPublication={chapter.handlePublishPublication}
    />
  )
}
