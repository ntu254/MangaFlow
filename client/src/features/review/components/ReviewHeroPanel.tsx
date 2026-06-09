import { MFBadge, MFCard } from "@/shared/components/ui"

export function ReviewHeroPanel() {
  return (
    <section className="grid gap-lg xl:grid-cols-[minmax(0,1fr)_22rem]">
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-sm">
              <MFBadge tone="primary" size="md">Review</MFBadge>
              <MFBadge tone="success" size="md">Review API actions connected</MFBadge>
              <MFBadge tone="success" size="md">Queue API connected</MFBadge>
            </div>
            <h1 className="mt-md text-headline-lg text-on-surface">Review queue</h1>
            <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
              This page loads backend review queue submissions for the current role and sends explicit backend submission action endpoints when a real submission id is provided. Comment lifecycle, readiness updates, payroll triggers, and file access remain backend-owned.
            </p>
          </div>
        </div>
      </MFCard>

      <MFCard>
        <h2 className="text-title-lg text-on-surface">Workflow boundary</h2>
        <p className="mt-sm text-body-md text-on-surface-muted">
          Decision buttons call backend review endpoints only after you provide a submission id. The backend still enforces Mangaka-before-Editor review and payroll trigger rules.
        </p>
      </MFCard>
    </section>
  )
}
