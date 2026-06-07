import { useParams, Link } from "react-router-dom"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFPagePreviewCard } from "@/shared/components/ui/MFPagePreviewCard"
import { MFSection } from "@/shared/components/ui/MFSection"

export function WorkspacePage() {
  const { chapterId } = useParams()
  return (
    <div className="space-y-6">
      <Link to={`/chapters/${chapterId}`} className="text-label-md text-primary hover:underline">&larr; Back to Chapter</Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg text-on-surface">Workspace: Chapter {chapterId}</h1>
          <p className="text-body-md text-on-surface-muted">Task workspace for assigned pages</p>
        </div>
        <div className="flex gap-2">
          <MFButton variant="outline">Save</MFButton>
          <MFButton>Submit for Review</MFButton>
        </div>
      </div>
      <MFSection title="Assigned Pages">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <MFPagePreviewCard pageNumber={3} status="IN_PROGRESS" />
          <MFPagePreviewCard pageNumber={4} status="IN_PROGRESS" />
          <MFPagePreviewCard pageNumber={5} status="SUBMITTED" />
        </div>
      </MFSection>
    </div>
  )
}
