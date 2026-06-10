import { PageShell } from "@/shared/components/layout/PageShell"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFSkeleton } from "./MFSkeleton"

interface MFRouteSkeletonProps {
  title?: string
  description?: string
}

export function MFRouteSkeleton({
  title = "Loading workspace",
  description = "Preparing the next MangaFlow screen.",
}: MFRouteSkeletonProps) {
  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <MFSkeleton className="h-6 w-32" />
            <MFSkeleton className="mt-md h-10 w-64 max-w-full rounded-3xl" />
            <p className="mt-sm text-body-md text-on-surface-muted">{description}</p>
          </div>
          <MFSkeleton className="h-11 w-36 rounded-full" />
        </div>
      </MFCard>

      <section aria-label={title} className="grid gap-lg md:grid-cols-3">
        <MFSkeleton className="h-28 w-full rounded-3xl" />
        <MFSkeleton className="h-28 w-full rounded-3xl" />
        <MFSkeleton className="h-28 w-full rounded-3xl" />
      </section>

      <MFCard>
        <MFSkeleton className="h-6 w-48" />
        <MFSkeleton className="mt-md h-40 w-full rounded-3xl" />
      </MFCard>
    </PageShell>
  )
}
