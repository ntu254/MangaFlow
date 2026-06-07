import { useParams, Link } from "react-router-dom"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFProgress } from "@/shared/components/ui/MFProgress"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFSection } from "@/shared/components/ui/MFSection"

export function SeriesDetailPage() {
  const { id } = useParams()
  return (
    <div className="space-y-6">
      <Link to="/series" className="text-label-md text-primary hover:underline">&larr; Back to Series</Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg text-on-surface">{id ?? "Series"}</h1>
          <p className="text-body-md text-on-surface-muted">Production progress and chapters</p>
        </div>
        <MFButton>New Chapter</MFButton>
      </div>
      <MFCard padding="md">
        <MFProgress value={65} label="Overall Progress" showValue tone="primary" />
      </MFCard>
      <MFSection title="Chapters">
        <div className="space-y-3">
          {[
            { num: 1, status: "PUBLISHED", pages: 20 },
            { num: 2, status: "IN_REVIEW", pages: 18 },
            { num: 3, status: "IN_PRODUCTION", pages: 15 },
          ].map((ch) => (
            <Link key={ch.num} to={`/chapters/${id}-ch${ch.num}`}>
              <MFCard padding="md" className="flex items-center justify-between transition-shadow hover:shadow-card">
                <div>
                  <h3 className="text-title-lg text-on-surface">Chapter {ch.num}</h3>
                  <p className="text-body-md text-on-surface-muted">{ch.pages} pages</p>
                </div>
                <MFBadge tone={ch.status === "PUBLISHED" ? "success" : ch.status === "IN_REVIEW" ? "secondary" : "primary"}>
                  {ch.status}
                </MFBadge>
              </MFCard>
            </Link>
          ))}
        </div>
      </MFSection>
    </div>
  )
}
