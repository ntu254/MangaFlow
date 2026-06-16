<<<<<<< HEAD:client/src/features/mangaka/components/series-detail/PageWorkspace.tsx
import { useMemo, useState } from 'react'
import type { Page } from '@/api/chapter'
import {
  useAcceptAISuggestion,
  useChapterPages,
  useCreateRegion,
  usePageImageDownloadUrl,
  usePageWorkspace,
  useRejectAISuggestion,
  useRunAISegmentation,
} from '@/hooks/useChapterWorkspace'
import { PageWorkspaceHeader } from './page-workspace/PageWorkspaceHeader'
import { PageWorkspaceSidebar } from './page-workspace/PageWorkspaceSidebar'
import { PageWorkspaceToolbar } from './page-workspace/PageWorkspaceToolbar'
import { PageWorkspaceCanvas } from './page-workspace/PageWorkspaceCanvas'
import { PageWorkspaceRightPanel } from './page-workspace/PageWorkspaceRightPanel'

interface PageWorkspaceProps {
  onBack: () => void
  chapterId: string
  initialPageId?: string
}

export function PageWorkspace({ onBack, chapterId, initialPageId }: PageWorkspaceProps) {
=======
import { useState } from 'react'
import { PageStudioHeader } from './page-studio/PageStudioHeader'
import { PageStudioSidebar } from './page-studio/PageStudioSidebar'
import { PageStudioToolbar } from './page-studio/PageStudioToolbar'
import { PageStudioCanvas } from './page-studio/PageStudioCanvas'
import { PageStudioRightPanel } from './page-studio/PageStudioRightPanel'

export function PageStudio({ onBack }: { onBack: () => void }) {
>>>>>>> fbac561b003b4b1365164d94c422b8f8bd9cd07a:client/src/features/mangaka/components/series-detail/PageStudio.tsx
  const [leftTab, setLeftTab] = useState<'pages' | 'layers'>('pages')
  const [rightTab, setRightTab] = useState<'task' | 'comments'>('task')
  const [drawMode] = useState(true)
  const { data: pages = [], isLoading: pagesLoading } = useChapterPages(chapterId)

  const fallbackPageId = pages[0]?.id
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(initialPageId)
  const activePageId = selectedPageId ?? initialPageId ?? fallbackPageId

  const { data: workspace, isLoading, isError, error } = usePageWorkspace(activePageId)
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
<<<<<<< HEAD:client/src/features/mangaka/components/series-detail/PageWorkspace.tsx
      <PageWorkspaceHeader onBack={onBack} chapterId={chapterId} page={workspace.page} title={pageTitle} />
=======
      
      {/* Header */}
      <PageStudioHeader onBack={onBack} />
>>>>>>> fbac561b003b4b1365164d94c422b8f8bd9cd07a:client/src/features/mangaka/components/series-detail/PageStudio.tsx

      <div className="flex flex-1 overflow-hidden">
<<<<<<< HEAD:client/src/features/mangaka/components/series-detail/PageWorkspace.tsx
        <PageWorkspaceSidebar
          leftTab={leftTab}
          setLeftTab={setLeftTab}
          pages={pages}
          regions={workspace.regions}
          aiResults={workspace.aiResults}
          selectedPageId={activePageId}
          onSelectPage={setSelectedPageId}
        />
=======
        
        {/* Left Column: Sidebar (Pages/Layers) */}
        <PageStudioSidebar leftTab={leftTab} setLeftTab={setLeftTab} />
>>>>>>> fbac561b003b4b1365164d94c422b8f8bd9cd07a:client/src/features/mangaka/components/series-detail/PageStudio.tsx

        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
<<<<<<< HEAD:client/src/features/mangaka/components/series-detail/PageWorkspace.tsx
          <PageWorkspaceToolbar onRunAI={() => runAI.mutate()} aiPending={runAI.isPending} />
=======
          
          {/* Toolbar */}
          <PageStudioToolbar />

          {/* Canvas Area */}
          <PageStudioCanvas />
>>>>>>> fbac561b003b4b1365164d94c422b8f8bd9cd07a:client/src/features/mangaka/components/series-detail/PageStudio.tsx

          <PageWorkspaceCanvas
            imageUrl={workingDownload?.downloadUrl}
            regions={workspace.regions}
            aiResults={workspace.aiResults}
            drawMode={drawMode}
            onDrawRegion={(bbox) => createRegion.mutate({ bbox, type: 'AREA' })}
          />
        </div>

<<<<<<< HEAD:client/src/features/mangaka/components/series-detail/PageWorkspace.tsx
        <PageWorkspaceRightPanel
          rightTab={rightTab}
          setRightTab={setRightTab}
          page={(selectedPage as Page) ?? workspace.page}
          regions={workspace.regions}
          aiResults={workspace.aiResults}
          onAcceptSuggestion={(aiResultId, suggestionIndex) => acceptSuggestion.mutate({ aiResultId, suggestionIndex })}
          onRejectSuggestion={(aiResultId, suggestionIndex) => rejectSuggestion.mutate({ aiResultId, suggestionIndex })}
          aiActionPending={acceptSuggestion.isPending || rejectSuggestion.isPending || createRegion.isPending}
        />
=======
        {/* Right Column: Task Creation & Comments */}
        <PageStudioRightPanel rightTab={rightTab} setRightTab={setRightTab} />

>>>>>>> fbac561b003b4b1365164d94c422b8f8bd9cd07a:client/src/features/mangaka/components/series-detail/PageStudio.tsx
      </div>
    </div>
  )
}
