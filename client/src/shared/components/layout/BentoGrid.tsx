import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { Card } from "@/shared/components/ui/card"

/**
 * 12-column responsive grid for dashboards. Children control their span via
 * BentoCard `colSpan`/`rowSpan` (or any col-span-* className).
 */
export function BentoGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12", className)}
      {...props}
    />
  )
}

const COL_SPAN: Record<number, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  12: "lg:col-span-12",
}

const ROW_SPAN: Record<number, string> = {
  2: "lg:row-span-2",
  3: "lg:row-span-3",
}

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12
  rowSpan?: 2 | 3
  /** Render bare (no Card chrome) — child brings its own container. */
  bare?: boolean
}

export function BentoCard({ colSpan = 4, rowSpan, bare, className, children, ...props }: BentoCardProps) {
  const span = cn(COL_SPAN[colSpan], rowSpan && ROW_SPAN[rowSpan])
  if (bare) {
    return (
      <div className={cn(span, className)} {...props}>
        {children}
      </div>
    )
  }
  return (
    <Card className={cn("p-5", span, className)} {...props}>
      {children}
    </Card>
  )
}
