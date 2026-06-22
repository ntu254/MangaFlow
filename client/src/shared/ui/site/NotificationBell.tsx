import { Link } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { useState } from "react";
import { useRole } from "@/shared/lib/role";
import { currentUserByRole } from "@/entities";
import { useNotifications, markRead, markAllRead } from "@/shared/lib/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/shadcn/popover";

export function NotificationBell() {
  const { role } = useRole();
  const me = currentUserByRole[role];
  const items = useNotifications(me.id).slice(0, 8);
  const unread = items.filter((n) => n.status === "UNREAD").length;
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-foreground/15 bg-foreground/5 hover:bg-foreground/10"
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-foreground/10 px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <button
            onClick={() => markAllRead(me.id)}
            className="text-[11px] text-foreground/60 hover:text-foreground"
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-96 divide-y divide-foreground/10 overflow-y-auto">
          {items.length === 0 && (
            <div className="px-3 py-8 text-center text-xs text-foreground/55">
              No notifications.
            </div>
          )}
          {items.map((n) => (
            <Link
              to={n.link ?? "/app/notifications"}
              key={n.id}
              onClick={() => {
                markRead(n.id);
                setOpen(false);
              }}
              className={`block px-3 py-2.5 text-xs hover:bg-foreground/5 ${n.status === "READ" ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-2">
                {n.status === "UNREAD" && (
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">{n.title}</div>
                  <div className="mt-0.5 line-clamp-2 text-foreground/65">{n.body}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-foreground/45">
                    {n.at}
                  </div>
                </div>
                {n.status === "READ" && <Check className="mt-0.5 h-3 w-3 text-foreground/40" />}
              </div>
            </Link>
          ))}
        </div>
        <div className="border-t border-foreground/10 px-3 py-2">
          <Link
            to="/app/notifications"
            onClick={() => setOpen(false)}
            className="text-[11px] text-foreground/70 hover:text-foreground"
          >
            View all →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
