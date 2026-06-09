import { PageShell } from "@/shared/components/layout/PageShell"
import { MFCard } from "@/shared/components/ui/MFCard"

interface ComingSoonPageProps {
  title: string
  description?: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <PageShell>
      <div className="space-y-xs">
        <h1 className="mf-headline-medium">{title}</h1>
        <MFCard padding="md">
          <p className="mf-body-large">
            {description ?? "This module is registered in navigation but not wired to real API yet."}
          </p>
          <p className="mf-body-small mf-text-muted mt-3">
            No action required. The backend remains the source of truth for permissions.
          </p>
        </MFCard>
      </div>
    </PageShell>
  )
}
