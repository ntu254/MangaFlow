import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateTime } from "@/shared/lib/format-date";
import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
  useNotificationsUnreadCount,
} from "../api/notifications-queries";

export function NotificationDropdown({
  notificationPath,
}: {
  notificationPath: string;
}) {
  const [open, setOpen] = useState(false);
  const unreadCount = useNotificationsUnreadCount();
  const { data: items = [] } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const markAllRead = useMarkAllReadMutation();

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const unreadIds = items.filter((i) => !i.readAt).map((i) => i.id);
    if (unreadIds.length > 0) {
      markAllRead.mutate({ notificationIds: unreadIds });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative grid size-9 place-items-center border-r border-[#d8d2c5] text-[#071225] hover:text-[#8e1d1d] transition-colors focus:outline-none cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-2 size-2 rounded-full bg-[#d62f2f] text-[0px]">
              {unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 shadow-xl border border-border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/40">
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-sm font-bold text-foreground">Notifications</h4>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                {unreadCount} unread
              </span>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" />
              {markAllRead.isPending ? "Marking..." : "Mark all read"}
            </button>
          ) : null}
        </div>

        {/* Notification List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border/40">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            items.slice(0, 8).map((item) => {
              const isUnread = !item.readAt;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isUnread) markRead.mutate(item.id);
                  }}
                  className={`flex items-start gap-3 p-3 text-xs transition-colors cursor-pointer ${
                    isUnread
                      ? "bg-amber-500/5 hover:bg-amber-500/10"
                      : "hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[10px]">
                    <Bell className="size-3 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    {item.title ? (
                      <p className={`truncate text-xs ${isUnread ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                        {item.title}
                      </p>
                    ) : null}
                    <p className="line-clamp-2 leading-relaxed text-[11px] text-foreground/90">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDateTime(item.createdAt || item.sentAt)}
                    </p>
                  </div>
                  {isUnread ? (
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-rose-500" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Navigate to All Notifications */}
        <div className="border-t border-border/60 p-2 bg-muted/20 text-center">
          <Link
            to={notificationPath}
            onClick={() => setOpen(false)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            View All Notifications <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
