import { Link } from "react-router-dom"
import { MFCard, MFCardHeader } from "@/shared/components/ui/MFCard"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFSection } from "@/shared/components/ui/MFSection"

export function SeriesListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-lg text-on-surface">Series</h1>
        <MFButton>New Series</MFButton>
      </div>
      <MFSection title="All Series">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { name: "Series A", status: "ONGOING", chapters: 5, tasks: 8 },
            { name: "Series B", status: "APPROVED", chapters: 2, tasks: 12 },
            { name: "Series C", status: "AT_RISK", chapters: 1, tasks: 3 },
          ].map((series) => (
            <Link key={series.name} to={`/series/${series.name.toLowerCase().replace(" ", "-")}`}>
              <MFCard padding="md" className="transition-shadow hover:shadow-card">
                <MFCardHeader>
                  <h3 className="text-title-lg text-on-surface">{series.name}</h3>
                  <MFBadge tone={series.status === "AT_RISK" ? "warning" : "success"}>
                    {series.status}
                  </MFBadge>
                </MFCardHeader>
                <div className="flex gap-4 text-body-md text-on-surface-muted">
                  <span>{series.chapters} chapters</span>
                  <span>{series.tasks} tasks</span>
                </div>
              </MFCard>
            </Link>
          ))}
        </div>
      </MFSection>
    </div>
  )
}
