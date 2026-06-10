import { useState } from "react"
import { Bell, Check, CheckCircle2, Clock, MessageSquare, UserPlus } from "lucide-react"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"

type NotificationType = "task" | "review" | "message" | "system" | "team"

interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

const initialNotifications: Notification[] = [
  { id: "1", type: "task", title: "New task assigned", description: "Chapter production task is ready in your queue.", timestamp: "2 minutes ago", read: false, actionUrl: "/app/assistant/tasks" },
  { id: "2", type: "review", title: "Review updated", description: "A submission changed state in the review workflow.", timestamp: "1 hour ago", read: false, actionUrl: "/app/mangaka/submissions" },
  { id: "3", type: "message", title: "Comment activity", description: "A production comment was added or resolved.", timestamp: "3 hours ago", read: true },
  { id: "4", type: "system", title: "Payroll tracking", description: "A calculated earning awaits confirmation or payout tracking.", timestamp: "1 day ago", read: true, actionUrl: "/app/mangaka/payroll" },
  { id: "5", type: "team", title: "Team update", description: "Board or production team membership changed.", timestamp: "2 days ago", read: true },
]

const iconMap = {
  task: Clock,
  review: CheckCircle2,
  message: MessageSquare,
  system: Bell,
  team: UserPlus,
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const unreadCount = notifications.filter((item) => !item.read).length
  const visible = filter === "unread" ? notifications.filter((item) => !item.read) : notifications

  usePageTitle("Notifications", "Central inbox for workflow alerts, assignments, and system warnings.")

  function markAsRead(id: string) {
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item))
  }

  function markAllAsRead() {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })))
  }

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <MFBadge tone="primary">Inbox</MFBadge>
            <h1 className="mt-md text-headline-lg text-on-surface">Notifications</h1>
            <p className="mt-sm text-body-md text-on-surface-muted">{unreadCount > 0 ? `${unreadCount} unread workflow alert(s)` : "All caught up."}</p>
          </div>
          <div className="flex flex-wrap gap-sm">
            <MFButton type="button" variant={filter === "all" ? "primary" : "outline"} onClick={() => setFilter("all")}>All</MFButton>
            <MFButton type="button" variant={filter === "unread" ? "primary" : "outline"} onClick={() => setFilter("unread")}>Unread</MFButton>
            <MFButton type="button" variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}><Check className="mr-xs h-4 w-4" />Mark all read</MFButton>
          </div>
        </div>
      </MFCard>

      <div className="grid gap-md">
        {visible.length === 0 ? (
          <MFCard><div className="py-xl text-center text-body-md text-on-surface-muted">No notifications to display.</div></MFCard>
        ) : visible.map((item) => {
          const Icon = iconMap[item.type]
          return (
            <MFCard key={item.id} className={item.read ? "opacity-70" : ""}>
              <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-md">
                  <div className="rounded-2xl bg-primary-container p-md text-on-primary-container"><Icon className="h-5 w-5" /></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-sm"><h2 className="text-title-md text-on-surface">{item.title}</h2>{!item.read ? <MFBadge tone="primary" size="sm">New</MFBadge> : null}</div>
                    <p className="mt-xs text-body-md text-on-surface-muted">{item.description}</p>
                    <p className="mt-sm text-label-sm text-on-surface-muted">{item.timestamp}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-sm">
                  {item.actionUrl ? <MFButton type="button" variant="outline" onClick={() => { window.location.href = item.actionUrl! }}>View</MFButton> : null}
                  {!item.read ? <MFButton type="button" variant="ghost" onClick={() => markAsRead(item.id)}>Mark read</MFButton> : null}
                </div>
              </div>
            </MFCard>
          )
        })}
      </div>
    </PageShell>
  )
}