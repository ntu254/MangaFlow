import { useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { InboxNotification } from "../services/notifications.service";

interface Props {
  inbox: InboxNotification[];
  onMarkAsRead: (inboxId: string, notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  promo: "bg-amber-500",
  trend_alert: "bg-violet-500",
  plan_reminder: "bg-blue-500",
  system: "bg-slate-500",
  daily_trend: "bg-teal-500",
};

export function NotificationDropdown({
  inbox,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: Props) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasUnread = inbox.some((n) => !n.is_read);

  // Đóng khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const bell = document.getElementById("notification-bell-btn");
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !bell?.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Đóng bằng Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleItemClick(item: InboxNotification) {
    if (!item.is_read) {
      onMarkAsRead(item.id, item.notification_id);
    }
    if (item.action_url) {
      window.open(item.action_url, "_blank", "noopener,noreferrer");
    }
    onClose();
  }

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Hộp thư thông báo"
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 animate-in slide-in-from-top-2 duration-200"
    >
      {/* Container chính */}
      <div className="bg-background border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            <span className="font-body text-sm font-semibold text-foreground">Thông báo</span>
            {hasUnread && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-destructive text-destructive-foreground leading-none">
                {inbox.filter((n) => !n.is_read).length}
              </span>
            )}
          </div>

          {hasUnread && (
            <button
              type="button"
              onClick={() => { onMarkAllAsRead(); }}
              className="flex items-center gap-1 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Đọc tất cả
            </button>
          )}
        </div>

        {/* Danh sách notifications */}
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
          {inbox.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-foreground/30" />
              </div>
              <p className="font-body text-sm font-medium text-foreground/60">Không có thông báo</p>
              <p className="font-body text-xs text-foreground/40 mt-1">
                Thông báo mới sẽ xuất hiện ở đây
              </p>
            </div>
          ) : (
            inbox.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={`w-full text-left px-4 py-3.5 flex gap-3 items-start transition-colors hover:bg-secondary/60 ${
                  !item.is_read ? "bg-accent/5" : "bg-background"
                }`}
              >
                {/* Type dot / icon */}
                <div className="shrink-0 mt-0.5">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 ${
                      !item.is_read
                        ? (NOTIFICATION_TYPE_COLORS[item.type] ?? "bg-accent")
                        : "bg-border"
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`font-body text-sm leading-snug line-clamp-1 ${
                        !item.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.action_url && (
                      <ExternalLink className="w-3 h-3 text-foreground/30 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="font-body text-xs text-foreground/55 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.body}
                  </p>
                  <p className="font-body text-xs text-foreground/35 mt-1.5">
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>

                {/* Read indicator */}
                {item.is_read && (
                  <Check className="w-3 h-3 text-foreground/25 shrink-0 mt-1" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {inbox.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border bg-secondary/30">
            <p className="font-body text-xs text-foreground/40 text-center">
              Hiển thị {inbox.length} thông báo gần nhất
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
