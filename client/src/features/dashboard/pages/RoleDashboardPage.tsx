import { useParams } from "react-router-dom"
import { RoutePlaceholderPage } from "@/shared/components/feedback/RoutePlaceholderPage"

const ROLE_LABELS: Record<string, string> = {
  mangaka: "Mangaka Dashboard",
  assistant: "Assistant Dashboard",
  editor: "Editor Dashboard",
  board: "Board Dashboard",
}

export function RoleDashboardPage() {
  const { role = "" } = useParams<{ role: string }>()
  const title = ROLE_LABELS[role] ?? "Dashboard"

  return (
    <RoutePlaceholderPage
      title={title}
      description="Your role-specific production overview will appear here."
      icon="dashboard"
      status="Shell Ready"
    />
  )
}
