import { useMemo, useState } from 'react'
import type { Page } from '@/features/chapters/services/chapter.api'
import {
  useAcceptAISuggestion,
  useChapterPages,
  useCreateRegion,
  usePageImageDownloadUrl,
  usePageStudio,
  useRejectAISuggestion,
  useRunAISegmentation,
} from '@/features/chapters/hooks/useChapterWorkspace'
import { PageStudioHeader } from '@/features/chapters/components/page-studio/PageStudioHeader'
import { PageStudioSidebar } from '@/features/chapters/components/page-studio/PageStudioSidebar'
import { PageStudioToolbar } from '@/features/chapters/components/page-studio/PageStudioToolbar'
import { PageStudioCanvas } from '@/features/chapters/components/page-studio/PageStudioCanvas'
import { PageStudioRightPanel } from '@/features/chapters/components/page-studio/PageStudioRightPanel'

interface PageStudioProps {
  onBack: () => void
  chapterId: string
  initialPageId?: string
}

export function PageStudio({ onBack, chapterId, initialPageId }: PageStudioProps) {
  const [leftTab, setLeftTab] = useState<'pages' | 'layers'>('pages')
  const [rightTab, setRightTab] = useState<'task' | 'comments'>('task')
  const [drawMode] = useState(true)
  const { data: pages = [], isLoading: pagesLoading } = useChapterPages(chapterId)

  const fallbackPageId = pages[0]?.id
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(initialPageId)
  const activePageId = selectedPageId ?? initialPageId ?? fallbackPageId

  const { data: workspace, isLoading, isError, error } = usePageStudio(activePageId)
  const workingAssetId = (workspace?.workingFileAsset as { id?: string; _id?: string } | undefined)?.id
    ?? (workspace?.workingFileAsset as { id?: string; _id?: string } | undefined)?._id
  const { data: workingDownload } = usePageImageDownloadUrl(workingAssetId)

  const createRegion = useCreateRegion(activePageId)
  const runAI = useRunAISegmentation(activePageId)
  const acceptSuggestion = useAcceptAISuggestion(activePageId)
  const rejectSuggestion = useRejectAISuggestion(activePageId)

  const pageTitle = useMemo(() => {
    if (!workspace?.page) return 'Page Workspace'
    return `Page ${workspace.page.pageNumber}`
  }, [workspace?.page])

  const selectedPage = pages.find((page) => page.id === activePageId) ?? workspace?.page

  if (pagesLoading && !pages.length) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading pages...</div>
  }

  if (!activePageId) {
    return <div className="flex h-full items-center justify-center text-gray-500">No pages available for this chapter yet.</div>
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading page workspace...</div>
  }

  if (isError || !workspace) {
    return <div className="flex h-full items-center justify-center text-red-500">{String((error as Error | undefined)?.message ?? 'Failed to load page workspace')}</div>
  }

  return (
    <div className="flex flex-col w-full h-full flex-1 bg-white overflow-hidden border-t border-gray-200">
      <PageStudioHeader onBack={onBack} chapterId={chapterId} page={workspace.page} title={pageTitle} />

      <div className="flex flex-1 overflow-hidden">
        <PageStudioSidebar
          leftTab={leftTab}
          setLeftTab={setLeftTab}
          pages={pages}
          regions={workspace.regions}
          aiResults={workspace.aiResults}
          selectedPageId={activePageId}
          onSelectPage={setSelectedPageId}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          <PageStudioToolbar onRunAI={() => runAI.mutate()} aiPending={runAI.isPending} />

          <PageStudioCanvas
            imageUrl={workingDownload?.downloadUrl}
            regions={workspace.regions}
            aiResults={workspace.aiResults}
            drawMode={drawMode}
            onDrawRegion={(bbox) => createRegion.mutate({ bbox, type: 'AREA' })}
          />
        </div>

        <PageStudioRightPanel
          rightTab={rightTab}
          setRightTab={setRightTab}
          page={(selectedPage as Page) ?? workspace.page}
          regions={workspace.regions}
          aiResults={workspace.aiResults}
          onAcceptSuggestion={(aiResultId, suggestionIndex) => acceptSuggestion.mutate({ aiResultId, suggestionIndex })}
          onRejectSuggestion={(aiResultId, suggestionIndex) => rejectSuggestion.mutate({ aiResultId, suggestionIndex })}
          aiActionPending={acceptSuggestion.isPending || rejectSuggestion.isPending || createRegion.isPending}
        />
      </div>
    </div>
  )
}
