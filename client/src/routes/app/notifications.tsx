import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { useRole } from "@/shared/lib/role";
import { currentUserByRole } from "@/entities";
import { useNotifications, markRead, markAllRead } from "@/shared/lib/notifications";
import { Link } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { role } = useRole();
  const me = currentUserByRole[role];
  const items = useNotifications(me.id);
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Notifications"
        jp="通知"
        description={`Inbox for ${me.name} · ${unread} unread`}
        actions={
          <button
            onClick={() => markAllRead(me.id)}
            className="h-8 rounded-md border border-foreground/15 px-3 text-xs font-medium hover:bg-foreground/5"
          >
            <Check className="mr-1 inline h-3 w-3" /> Mark all read
          </button>
        }
      />

      <div className="rounded-md border border-foreground/10 bg-card divide-y divide-foreground/10">
        {items.length === 0 && <EmptyState title="You're all caught up" hint="No notifications yet. You'll be notified when something needs your attention." icon={Bell} />}
        {items.map((n) => (
          <Link
            to={n.link ?? "/app/notifications"}
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`flex items-start gap-3 px-4 py-3 hover:bg-foreground/5 ${n.read ? "opacity-60" : ""}`}
          >
            <Bell className="mt-1 h-4 w-4 text-foreground/50" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <div className="text-sm font-semibold">{n.title}</div>
                {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />}
              </div>
              <div className="mt-0.5 text-xs text-foreground/70">{n.body}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-foreground/45">
                {n.type} · {n.at}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
