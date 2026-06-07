import type { HTMLAttributes } from "react"
import { boardDecisionStatusUI, type StatusUiConfig } from "@/shared/lib/status-ui"
import { StatusBadge } from "./StatusBadge"

interface DecisionBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: string
  mapping?: Record<string, StatusUiConfig>
  size?: "sm" | "md"
}

export function DecisionBadge({
  status,
  mapping = boardDecisionStatusUI,
  size = "sm",
  ...props
}: DecisionBadgeProps) {
  return <StatusBadge status={status} mapping={mapping} size={size} {...props} />
}
