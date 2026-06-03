import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Loader2,
  Calendar,
  ClipboardList,
  MessageSquare,
  Coins,
  AlertTriangle,
  Send,
  CheckCircle2,
  RefreshCw,
  FolderSync
} from "lucide-react";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
  type NotificationType
} from "../api/notification";

const typeOptions: { value: NotificationType | "ALL"; label: string; icon: any }[] = [
  { value: "ALL", label: "All Types", icon: Bell },
  { value: "TASK_ASSIGNED", label: "Tasks Assigned", icon: ClipboardList },
  { value: "TASK_SUBMITTED", label: "Submissions", icon: Send },
  { value: "TASK_APPROVED", label: "Approvals", icon: CheckCircle2 },
  { value: "REVISION_REQUESTED", label: "Revisions", icon: RefreshCw },
  { value: "EDITOR_COMMENT", label: "Comments", icon: MessageSquare },
  { value: "BOARD_DECISION", label: "Board Decisions", icon: FolderSync },
  { value: "RANKING_WARNING", label: "Ranking Warnings", icon: AlertTriangle },
  { value: "PAYROLL_CONFIRMED", label: "Payroll", icon: Coins }
];

export function NotificationsPage() {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST">("NEWEST");

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      const data = await listNotifications(token, { limit: 50 });
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;
      await markNotificationRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;
      await deleteNotification(token, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleClearRead = async () => {
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;
      const readNotifications = notifications.filter((n) => n.isRead);
      for (const n of readNotifications) {
        await deleteNotification(token, n.id);
      }
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
    }
  };

  // Filter and Sort notifications locally
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        const matchesStatus = statusFilter === "ALL" || !n.isRead;
        const matchesType = typeFilter === "ALL" || n.type === typeFilter;
        return matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortBy === "NEWEST" ? dateB - dateA : dateA - dateB;
      });
  }, [notifications, statusFilter, typeFilter, sortBy]);

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return ClipboardList;
      case "TASK_SUBMITTED":
        return Send;
      case "TASK_APPROVED":
        return CheckCircle2;
      case "REVISION_REQUESTED":
        return RefreshCw;
      case "EDITOR_COMMENT":
        return MessageSquare;
      case "BOARD_DECISION":
        return FolderSync;
      case "RANKING_WARNING":
        return AlertTriangle;
      case "PAYROLL_CONFIRMED":
        return Coins;
      default:
        return Bell;
    }
  };

  const getColorForType = (type: NotificationType) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "TASK_SUBMITTED":
        return "bg-teal-50 text-teal-600 border-teal-100";
      case "TASK_APPROVED":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "REVISION_REQUESTED":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "EDITOR_COMMENT":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "BOARD_DECISION":
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "RANKING_WARNING":
        return "bg-red-50 text-red-600 border-red-100";
      case "PAYROLL_CONFIRMED":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-[#9065d5]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#eadff6] shadow-[0_2px_12px_rgba(144,101,213,0.02)]">
        <div>
          <h1 className="text-2xl font-bold text-[#2f243a]">Notification Center</h1>
          <p className="text-xs text-[#5f5270] mt-1">
            You have {notifications.filter((n) => !n.isRead).length} unread notifications.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            className="border-[#eadff6] hover:bg-[#f8f1ff] text-[#5f5270] text-xs flex items-center gap-1.5 h-9 rounded-xl"
            disabled={notifications.every((n) => n.isRead)}
          >
            <CheckCheck className="size-4" /> Mark all read
          </Button>
          <Button
            onClick={handleClearRead}
            variant="outline"
            className="border-red-100 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs flex items-center gap-1.5 h-9 rounded-xl"
            disabled={notifications.every((n) => !n.isRead)}
          >
            <Trash2 className="size-4" /> Clear read
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#eadff6]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filters */}
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "ALL"
                ? "bg-[#9065d5] text-white shadow-sm"
                : "text-[#5f5270] hover:bg-[#f8f1ff]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("UNREAD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "UNREAD"
                ? "bg-[#9065d5] text-white shadow-sm"
                : "text-[#5f5270] hover:bg-[#f8f1ff]"
            }`}
          >
            Unread
          </button>

          <div className="w-[1px] h-5 bg-[#eadff6] mx-1" />

          {/* Type filters */}
          <div className="relative group">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NotificationType | "ALL")}
              className="appearance-none pl-8 pr-8 py-1.5 bg-white border border-[#eadff6] hover:border-[#9065d5]/50 text-[#5f5270] text-xs font-medium rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#9065d5]"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8a7a99] pointer-events-none" />
          </div>
        </div>

        {/* Sort option */}
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 text-[#8a7a99]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "NEWEST" | "OLDEST")}
            className="bg-transparent text-xs font-medium text-[#5f5270] cursor-pointer focus:outline-none"
          >
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const ItemIcon = getIconForType(notification.type);
            const colorClass = getColorForType(notification.type);

            return (
              <div
                key={notification.id}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                className={`flex gap-4 p-4 rounded-xl border transition-all duration-300 relative group cursor-pointer ${
                  notification.isRead
                    ? "bg-white border-[#eadff6] hover:border-[#d4c4ee]/60"
                    : "bg-[#fcfaff] border-[#9065d5]/20 hover:border-[#9065d5]/40 shadow-sm"
                }`}
              >
                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 size-2 rounded-full bg-[#9065d5]" />
                )}

                {/* Notification icon */}
                <div className={`p-2.5 rounded-lg border h-fit ${colorClass}`}>
                  <ItemIcon className="size-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold truncate ${
                      notification.isRead ? "text-[#2f243a]" : "text-[#9065d5]"
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] text-[#8a7a99] shrink-0 mt-0.5">
                      {new Date(notification.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-[#5f5270] mt-1 leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {/* Action button */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(notification.id);
                    }}
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg text-[#8a7a99] hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-[#eadff6] rounded-2xl">
            <div className="p-4 bg-[#f8f1ff] rounded-full mb-4">
              <Bell className="size-8 text-[#9065d5] opacity-40 animate-bounce" />
            </div>
            <h3 className="font-semibold text-[#2f243a] text-sm">No notifications found</h3>
            <p className="text-xs text-[#5f5270] mt-1 max-w-xs">
              {statusFilter === "UNREAD"
                ? "You've read all your notifications! Nice job."
                : "We couldn't find any notifications matching your filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
