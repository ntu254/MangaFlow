import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"

interface ComingSoonPageProps {
  title: string
  description?: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Registered route</MFBadge>
          <MFBadge tone="neutral" size="md">Backend-owned boundary</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">{title}</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          {description ?? "This module is registered in navigation but not wired to real API yet."}
        </p>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-3">
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Status</p>
          <p className="mt-sm text-title-lg text-on-surface">Planned surface</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Permission model</p>
          <p className="mt-sm text-title-lg text-on-surface">Backend first</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Next step</p>
          <p className="mt-sm text-title-lg text-on-surface">Story scoped</p>
        </MFCard>
      </section>

      <MFCard padding="md">
        <div className="rounded-3xl bg-surface-low p-lg">
          <p className="text-body-md text-on-surface-muted">
            {description ?? "This module is registered in navigation but not wired to real API yet."}
          </p>
          <p className="mt-sm text-label-sm text-on-surface-muted">
            No action required. The backend remains the source of truth for permissions.
          </p>
        </div>
      </MFCard>
    </PageShell>
  )
}
