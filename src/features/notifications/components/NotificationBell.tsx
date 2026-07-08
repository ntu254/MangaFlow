import { useState, useRef } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { inbox, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!user) return null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        id="notification-bell-btn"
        type="button"
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground/50 hover:text-foreground hover:border-accent/30 transition-colors"
      >
        <Bell className="w-4 h-4" />

        {/* Badge số chưa đọc */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold leading-none animate-in zoom-in-50 duration-200"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown inbox */}
      {open && (
        <NotificationDropdown
          inbox={inbox}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
