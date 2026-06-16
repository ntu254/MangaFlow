import { useParams, useNavigate } from 'react-router-dom'
import { PageStudio } from '@/features/mangaka/components/series-detail/PageStudio'
import { usePageStudio } from '@/hooks/useChapterWorkspace'

export default function PageStudioPage() {
  const { pageId } = useParams()
  const navigate = useNavigate()
  
  const { data: workspace, isLoading, isError } = usePageStudio(pageId)

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading studio...</div>
  }

  if (isError || !workspace) {
    return <div className="flex h-screen items-center justify-center text-red-500">Failed to load studio or page not found.</div>
  }

  const chapterId = workspace.page.chapterId

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 bg-white overflow-hidden">
      <PageStudio 
        onBack={() => navigate(-1)} 
        chapterId={chapterId} 
        initialPageId={pageId} 
      />
    </div>
  )
}
