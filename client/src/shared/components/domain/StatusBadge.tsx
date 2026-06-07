import type { HTMLAttributes } from "react"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import {
  getStatusUi,
  type StatusUiConfig,
} from "@/shared/lib/status-ui"

interface StatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: string
  mapping: Record<string, StatusUiConfig>
  size?: "sm" | "md"
}

export function StatusBadge({
  status,
  mapping,
  size = "sm",
  ...props
}: StatusBadgeProps) {
  const config = getStatusUi(status, mapping)

  return (
    <MFBadge tone={config.tone} size={size} {...props}>
      {config.label}
    </MFBadge>
  )
}
