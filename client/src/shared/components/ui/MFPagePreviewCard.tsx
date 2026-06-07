import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"
import { MFBadge } from "./MFBadge"
import { getStatusUi, pageStatusUI } from "@/shared/lib/status-ui"

interface MFPagePreviewCardProps extends HTMLAttributes<HTMLDivElement> {
  pageNumber: number
  thumbnailUrl?: string
  status?: string
  isSelected?: boolean
}

export const MFPagePreviewCard = forwardRef<HTMLDivElement, MFPagePreviewCardProps>(
  ({ className, pageNumber, thumbnailUrl, status, isSelected, ...props }, ref) => {
    const statusConfig = status ? getStatusUi(status, pageStatusUI) : undefined

    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-2xl bg-surface-low shadow-ambient transition-all duration-150",
          "hover:shadow-card",
          isSelected && "ring-2 ring-primary ring-offset-2",
          className,
        )}
        {...props}
      >
        <div className="aspect-[3/4] w-full">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`Page ${pageNumber}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-container">
              <span className="text-headline-lg text-on-surface-muted">{pageNumber}</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent p-2">
          <span className="text-label-sm font-semibold text-white">p.{pageNumber}</span>
          {statusConfig && (
            <MFBadge tone={statusConfig.tone} size="sm">
              {statusConfig.label}
            </MFBadge>
          )}
        </div>
      </div>
    )
  },
)

MFPagePreviewCard.displayName = "MFPagePreviewCard"
