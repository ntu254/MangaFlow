import { MFCard } from "@/shared/components/ui/MFCard"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFSection } from "@/shared/components/ui/MFSection"
import { getStatusUi, voteStatusUI } from "@/shared/lib/status-ui"

const boardItems = [
  { series: "Series A", chapter: "Chapter 5", votes: 4, status: "APPROVED" },
  { series: "Series B", chapter: "Chapter 2", votes: 2, status: "PENDING" },
  { series: "Series D", chapter: "Proposal", votes: 1, status: "PENDING" },
]

export function BoardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-headline-lg text-on-surface">Board</h1>
      <MFSection title="Pending Votes">
        <div className="space-y-3">
          {boardItems.map((item) => {
            const voteStatus = getStatusUi(item.status, voteStatusUI)
            return (
              <MFCard key={`${item.series}-${item.chapter}`} padding="md" className="flex items-center justify-between">
                <div>
                  <h3 className="text-title-lg text-on-surface">{item.chapter}</h3>
                  <p className="text-body-md text-on-surface-muted">{item.series} &middot; {item.votes} votes</p>
                </div>
                <div className="flex items-center gap-3">
                  <MFBadge tone={voteStatus.tone}>{voteStatus.label}</MFBadge>
                  <MFButton size="sm" variant="outline">Vote</MFButton>
                </div>
              </MFCard>
            )
          })}
        </div>
      </MFSection>
    </div>
  )
}
