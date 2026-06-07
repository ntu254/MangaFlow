import { MFCard } from "@/shared/components/ui/MFCard"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFProgress } from "@/shared/components/ui/MFProgress"
import { MFPagePreviewCard } from "@/shared/components/ui/MFPagePreviewCard"

export function HeroWorkspacePreview() {
  return (
    <div className="mx-auto mt-12 max-w-4xl">
      <div className="grid gap-4 md:grid-cols-3">
        <MFCard padding="md" className="md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-title-lg text-on-surface">Series: Shonen Dream</h3>
              <p className="text-body-md text-on-surface-muted">Chapter 5 — Page Progress</p>
            </div>
            <MFBadge tone="success">In Production</MFBadge>
          </div>
          <MFProgress value={65} label="Chapter Progress" showValue size="md" tone="primary" />
          <div className="mt-4 grid grid-cols-4 gap-2">
            <MFPagePreviewCard pageNumber={1} status="APPROVED" />
            <MFPagePreviewCard pageNumber={2} status="APPROVED" />
            <MFPagePreviewCard pageNumber={3} status="SUBMITTED" />
            <MFPagePreviewCard pageNumber={4} status="IN_PROGRESS" />
          </div>
        </MFCard>
        <div className="space-y-4">
          <MFCard padding="md">
            <h4 className="mb-2 text-label-md font-semibold text-on-surface-muted">Pending Tasks</h4>
            <div className="space-y-2">
              {["Ink page 4", "Tone page 3", "Background p.7"].map((task) => (
                <div key={task} className="rounded-xl bg-surface-low px-3 py-2 text-body-md text-on-surface">
                  {task}
                </div>
              ))}
            </div>
          </MFCard>
          <MFCard padding="md">
            <h4 className="mb-2 text-label-md font-semibold text-on-surface-muted">In Review</h4>
            <div className="flex items-center gap-3">
              <MFBadge tone="secondary">3 submissions</MFBadge>
              <span className="text-label-sm text-on-surface-muted">Awaiting editor</span>
            </div>
          </MFCard>
        </div>
      </div>
    </div>
  )
}
