import { ChapterPagesPanel } from "./ChapterDetailPanels"
import type { useChapterDetail } from "../hooks/useChapterDetail"

type ChapterDetailState = ReturnType<typeof useChapterDetail>

interface ChapterPagesTabProps {
  chapter: Pick<ChapterDetailState, "pagesError" | "pagesLoading" | "pageRows" | "loadPages" | "selectedPage">
}

export function ChapterPagesTab({ chapter }: ChapterPagesTabProps) {
  return (
    <ChapterPagesPanel
      pagesError={chapter.pagesError}
      pagesLoading={chapter.pagesLoading}
      pageRows={chapter.pageRows}
      loadPages={chapter.loadPages}
      selectedPage={chapter.selectedPage}
    />
  )
}
