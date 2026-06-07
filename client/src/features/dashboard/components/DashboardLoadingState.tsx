import { MFCard } from "@/shared/components/ui/MFCard"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"

export function DashboardLoadingState() {
  return (
    <div className="space-y-lg" aria-label="Loading dashboard" role="status">
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex items-center gap-lg">
          <MFSkeleton className="h-14 w-14 shrink-0" />
          <div className="w-full space-y-sm">
            <MFSkeleton className="h-6 max-w-xs" />
            <MFSkeleton className="h-4 max-w-lg" />
          </div>
        </div>
      </MFCard>
      <div className="grid gap-lg md:grid-cols-2">
        {[0, 1].map((item) => (
          <MFCard key={item} className="space-y-md">
            <MFSkeleton className="h-5 w-32" />
            <MFSkeleton className="h-4 w-full" />
            <MFSkeleton className="h-10 w-36" />
          </MFCard>
        ))}
      </div>
    </div>
  )
}
