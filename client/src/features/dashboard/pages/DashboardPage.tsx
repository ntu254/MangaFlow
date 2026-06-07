import { MFCard, MFCardHeader } from "@/shared/components/ui/MFCard"
import { MFProgress } from "@/shared/components/ui/MFProgress"
import { MFSection } from "@/shared/components/ui/MFSection"
import { MFBadge } from "@/shared/components/ui/MFBadge"

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-headline-lg text-on-surface">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <MFCard padding="md">
          <MFCardHeader>
            <span className="text-label-md text-on-surface-muted">Active Series</span>
          </MFCardHeader>
          <p className="text-display text-primary">4</p>
        </MFCard>
        <MFCard padding="md">
          <MFCardHeader>
            <span className="text-label-md text-on-surface-muted">Pending Tasks</span>
          </MFCardHeader>
          <p className="text-display text-secondary">12</p>
        </MFCard>
        <MFCard padding="md">
          <MFCardHeader>
            <span className="text-label-md text-on-surface-muted">In Review</span>
          </MFCardHeader>
          <p className="text-display text-tertiary">3</p>
        </MFCard>
      </div>
      <MFSection title="Production Progress">
        <MFCard padding="md">
          <MFProgress value={65} label="Series A - Chapter 5" showValue tone="primary" />
          <MFProgress value={30} label="Series B - Chapter 2" showValue tone="secondary" className="mt-4" />
          <MFProgress value={90} label="Series C - Chapter 1" showValue tone="success" className="mt-4" />
          <MFProgress value={15} label="Series D - Chapter 3" showValue tone="warning" className="mt-4" />
        </MFCard>
      </MFSection>
      <MFSection title="Recent Activity">
        <MFCard padding="md">
          <div className="space-y-3">
            {[
              { action: "Task submitted", series: "Series A", badge: "Submitted" },
              { action: "Chapter approved", series: "Series C", badge: "Approved" },
              { action: "Revision requested", series: "Series B", badge: "Revision" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-surface-low px-4 py-3">
                <div>
                  <p className="text-label-md text-on-surface">{item.action}</p>
                  <p className="text-body-md text-on-surface-muted">{item.series}</p>
                </div>
                <MFBadge tone="primary">{item.badge}</MFBadge>
              </div>
            ))}
          </div>
        </MFCard>
      </MFSection>
    </div>
  )
}
