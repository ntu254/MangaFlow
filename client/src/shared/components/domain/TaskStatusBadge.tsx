import type { ComponentProps } from "react"
import { taskStatusUI } from "@/shared/lib/status-ui"
import { StatusBadge } from "./StatusBadge"

interface TaskStatusBadgeProps
  extends Omit<ComponentProps<typeof StatusBadge>, "mapping"> {}

export function TaskStatusBadge(props: TaskStatusBadgeProps) {
  return <StatusBadge mapping={taskStatusUI} {...props} />
}
