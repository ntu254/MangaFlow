import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Bell, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { notificationsApi, type ApiNotification } from "@/shared/api/notifications";
import { extractErrorMessage } from "@/shared/api/_client";

const ASSISTANT_NOTIFICATIONS_QK = ["assistant", "notifications"] as const;

export const Route = createFileRoute("/app/assistant/notifications")({
  component: AssistantNotificationsPage,
});

function AssistantNotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ASSISTANT_NOTIFICATIONS_QK,
    queryFn: () => notificationsApi.list({ limit: 50 }),
  });

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((item) => item.status === "UNREAD");

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSISTANT_NOTIFICATIONS_QK }),
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const archive = useMutation({
    mutationFn: notificationsApi.archive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSISTANT_NOTIFICATIONS_QK }),
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await Promise.all(unread.map((item) => notificationsApi.markRead(item.id)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSISTANT_NOTIFICATIONS_QK }),
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        jp="通知"
        description={`Assistant inbox · ${unread.length} unread`}
        actions={
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={unread.length === 0 || markAllRead.isPending}
            className="h-8 rounded-md border border-foreground/15 px-3 text-xs font-medium hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markAllRead.isPending ? (
              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            ) : (
              <Check className="mr-1 inline h-3 w-3" />
            )}
            Mark all read
          </button>
        }
      />

      <div className="divide-y divide-foreground/10 rounded-md border border-foreground/10 bg-card">
        {error ? (
          <div className="px-4 py-8 text-center text-sm text-destructive">
            {extractErrorMessage(error)}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-foreground/50">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            hint="No notifications yet. You'll be notified when a team invite, task update, or review needs your attention."
            icon={Bell}
          />
        ) : (
          notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onRead={(id) => markRead.mutate(id)}
              onArchive={(id) => archive.mutate(id)}
              isMutating={markRead.isPending || archive.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
  onArchive,
  isMutating,
}: {
  notification: ApiNotification;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  isMutating: boolean;
}) {
  const isUnread = notification.status === "UNREAD";
  const href = normalizeAssistantLink(notification.link);

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 hover:bg-foreground/5 ${
        isUnread ? "" : "opacity-65"
      }`}
    >
      <Bell className="mt-1 h-4 w-4 shrink-0 text-foreground/50" />
      <Link
        to={href}
        onClick={() => {
          if (isUnread) onRead(notification.id);
        }}
        className="min-w-0 flex-1"
      >
        <div className="flex items-baseline gap-2">
          <div className="text-sm font-semibold">{notification.title}</div>
          {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />}
        </div>
        <div className="mt-0.5 text-xs text-foreground/70">{notification.body}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-foreground/45">
          {notification.type} · {formatDate(notification.createdAt)}
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1 opacity-100 md:opacity-0 md:transition group-hover:opacity-100">
        {isUnread && (
          <button
            type="button"
            onClick={() => onRead(notification.id)}
            disabled={isMutating}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 text-[11px] text-foreground/65 hover:bg-foreground/5 disabled:opacity-40"
          >
            <Check className="h-3 w-3" />
            Read
          </button>
        )}
        <button
          type="button"
          onClick={() => onArchive(notification.id)}
          disabled={isMutating}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 text-[11px] text-foreground/65 hover:bg-foreground/5 disabled:opacity-40"
        >
          <Archive className="h-3 w-3" />
          Archive
        </button>
      </div>
    </div>
  );
}

function normalizeAssistantLink(link?: string) {
  if (!link) return "/app/assistant/notifications";
  if (link === "/app/tasks") return "/app/assistant/tasks";
  if (link.startsWith("/app/tasks/")) return link.replace("/app/tasks", "/app/assistant/tasks");
  return link;
}

function formatDate(value?: string) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
