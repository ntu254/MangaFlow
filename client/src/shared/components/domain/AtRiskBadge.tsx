import type { HTMLAttributes } from "react"
import { atRiskStatusUI, type StatusUiConfig } from "@/shared/lib/status-ui"
import { StatusBadge } from "./StatusBadge"

interface AtRiskBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: string
  mapping?: Record<string, StatusUiConfig>
  size?: "sm" | "md"
}

export function AtRiskBadge({
  status,
  mapping = atRiskStatusUI,
  size = "sm",
  ...props
}: AtRiskBadgeProps) {
  return <StatusBadge status={status} mapping={mapping} size={size} {...props} />
}
