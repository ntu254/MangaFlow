import { useParams, useNavigate } from 'react-router-dom'
import { PageStudio } from '@/features/series/components/series-detail/PageStudio'
import { usePageStudio } from '@/features/chapters/hooks/useChapterWorkspace'
import { usePageChrome } from '@/shared/components/layout/page-chrome'

export default function PageStudioPage() {
  const { pageId } = useParams()
  const navigate = useNavigate()

  // Full-screen studio: hide the global sidebar and remove main padding.
  usePageChrome({ sidebar: 'hidden', bleed: true })

  const { data: workspace, isLoading, isError } = usePageStudio(pageId)

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading studio...</div>
  }

  if (isError || !workspace) {
    return <div className="flex h-full items-center justify-center text-rose-500">Failed to load studio or page not found.</div>
  }

  return (
    <div className="flex h-full overflow-hidden bg-card">
      <PageStudio onBack={() => navigate(-1)} chapterId={workspace.page.chapterId} initialPageId={pageId} />
    </div>
  )
}
