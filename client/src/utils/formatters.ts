export function labelizeStatus(value: string) {
  if (!value) return ""
  return value.split("_").join(" ")
}

export function statusColor(status: string) {
  switch (status) {
    case "APPROVED":
      return "emerald"
    case "TASK_ASSIGNED":
    case "IN_PROGRESS":
      return "orange"
    case "PROCESSING_FAILED":
      return "red"
    case "UNDER_REVIEW":
    case "UPLOADED":
      return "yellow"
    default:
      return "gray"
  }
}
