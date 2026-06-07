import type { HTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"

export function MFSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-surface-container-high",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  )
}
