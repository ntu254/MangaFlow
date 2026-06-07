import { useParams, Link } from "react-router-dom"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFProgress } from "@/shared/components/ui/MFProgress"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFPagePreviewCard } from "@/shared/components/ui/MFPagePreviewCard"
import { MFSection } from "@/shared/components/ui/MFSection"

export function ChapterDetailPage() {
  const { id } = useParams()
  const pageStatus = (i: number) => {
    if (i < 3) return "APPROVED"
    if (i < 5) return "SUBMITTED"
    if (i === 5) return "IN_PROGRESS"
    return "UPLOADED"
  }

  return (
    <div className="space-y-6">
      <Link to="/series/series-a" className="text-label-md text-primary hover:underline">&larr; Back to Series</Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg text-on-surface">Chapter {id ?? "1"}</h1>
          <p className="text-body-md text-on-surface-muted">Page management and progress</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/workspace/${id}`}>
            <MFButton variant="secondary">Workspace</MFButton>
          </Link>
          <MFButton>Upload Pages</MFButton>
        </div>
      </div>
      <MFCard padding="md">
        <MFProgress value={70} label="Chapter Progress" showValue tone="primary" />
      </MFCard>
      <MFSection title="Pages (8)">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 8 }, (_, i) => (
            <MFPagePreviewCard
              key={i + 1}
              pageNumber={i + 1}
              status={pageStatus(i)}
            />
          ))}
        </div>
      </MFSection>
    </div>
  )
}
