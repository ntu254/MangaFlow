import { MFCard } from "@/shared/components/ui/MFCard"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFButton } from "@/shared/components/ui/MFButton"
import { MFSection } from "@/shared/components/ui/MFSection"
import { MFTabs } from "@/shared/components/ui/MFTabs"

const reviewItems = [
  { chapter: "Chapter 5", series: "Series A", status: "MANGAKA_APPROVED", reviewer: "Editor" },
  { chapter: "Chapter 2", series: "Series B", status: "SUBMITTED", reviewer: "Mangaka" },
  { chapter: "Chapter 1", series: "Series C", status: "REVISION_REQUESTED", reviewer: "Editor" },
]

export function ReviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-headline-lg text-on-surface">Review</h1>
      <MFSection title="Submission Queue">
        <MFCard padding="md">
          <MFTabs
            tabs={[
              { id: "pending", label: "Pending", count: reviewItems.length },
              { id: "approved", label: "Approved", count: 0 },
              { id: "all", label: "All", count: reviewItems.length },
            ]}
            activeTab="pending"
            onTabChange={() => {}}
          />
        </MFCard>
        <div className="mt-4 space-y-3">
          {reviewItems.map((item) => (
            <MFCard key={item.chapter} padding="md" className="flex items-center justify-between">
              <div>
                <h3 className="text-title-lg text-on-surface">{item.chapter}</h3>
                <p className="text-body-md text-on-surface-muted">{item.series} &middot; {item.reviewer}</p>
              </div>
              <div className="flex items-center gap-3">
                <MFBadge tone="secondary">Needs Review</MFBadge>
                <MFButton size="sm">Review</MFButton>
              </div>
            </MFCard>
          ))}
        </div>
      </MFSection>
    </div>
  )
}
