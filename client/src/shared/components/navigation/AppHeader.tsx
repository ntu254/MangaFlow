import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserButton, useAuth } from "@clerk/react";
import {
  Search,
  Bell,
  Loader2,
  ClipboardList,
  MessageSquare,
  Coins,
  AlertTriangle,
  Send,
  CheckCircle2,
  RefreshCw,
  FolderSync
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiBaseUrl } from "@/shared/api";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  type Notification,
  type NotificationType
} from "@/features/notification";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

const pageTitleMap: Record<string, string> = {
  "dashboard": "Dashboard",
  "series": "My Series",
  "manuscripts": "Manuscripts",
  "chapters": "Chapters",
  "pages": "Pages",
  "tasks": "Tasks",
  "submissions": "Submissions",
  "comments": "Comments",
  "ranking": "Ranking",
  "payroll": "Payroll",
  "users": "Users",
  "board/members": "Board Members",
  "task-rates": "Task Rates",
  "storage": "Storage",
  "audit-logs": "Audit Logs",
  "system-health": "System Health",
  "publication": "Publication",
  "series-approvals": "Series Approvals",
  "votes": "My Votes",
  "at-risk": "At-Risk Series",
  "decisions": "Decisions",
  "tie-breaks": "Tie-break Queue",
  "revisions": "Revisions",
  "earnings": "Earnings",
};

function resolvePageTitle(pathname: string): string {
  const relativePath = pathname.replace(/^\/app\/[^/]+\/?/, "");
  if (/^chapters\/[^/]+\/pages$/.test(relativePath)) return "Chapter Pages";
  if (/^pages\/[^/]+\/workspace$/.test(relativePath)) return "Page Workspace";
  if (/^series\/[^/]+\/manuscripts\/[^/]+\/review$/.test(relativePath)) return "Manuscript Review";
  if (/^series\/[^/]+\/?$/.test(relativePath)) return "Series Detail";
  if (/^tasks\/[^/]+\/?$/.test(relativePath)) return "Task Detail";
  if (/^ranking\/import$/.test(relativePath)) return "Import Ranking";
  if (/^series\/new$/.test(relativePath)) return "New Series";
  if (/^users\/role-review$/.test(relativePath)) return "Role Review";
  const segments = relativePath.split("/").filter(Boolean);
  const key = segments.join("/") || "dashboard";
  return pageTitleMap[key] || key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type AppHeaderProps = {
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
};

export function AppHeader({ breadcrumb, actions, searchPlaceholder = "Search series, tasks, chapters...", onSearchChange, onSearchSubmit }: AppHeaderProps) {
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resolvedBreadcrumb = breadcrumb ?? [{ label: resolvePageTitle(location.pathname) }];
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!isSignedIn) return;
    try {
      setIsLoading(true);
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;

      const [count, list] = await Promise.all([
        getUnreadCount(token),
        listNotifications(token, { limit: 5 })
      ]);
      setUnreadCount(count);
      setNotifications(list);
    } catch (err) {
      console.warn("Failed to fetch header notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();

    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [getToken, isSignedIn]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;
      await markNotificationRead(token, id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

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

  return (
    <header className="h-16 border-b border-mf-border bg-mf-bg-card/80 backdrop-blur-sm flex items-center px-6 sticky top-0 z-10">
      <div className="flex-1 flex items-center gap-6">
        {/* Breadcrumbs */}
        {resolvedBreadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 text-sm">
            {resolvedBreadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-mf-text-disabled">/</span>}
                {item.href ? (
                  <Link to={item.href} className="text-mf-text-secondary hover:text-mf-primary transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-mf-text font-medium">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Global Search Input */}
        <div className="relative max-w-xs w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a7a99]" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (onSearchSubmit) onSearchSubmit(searchQuery);
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (onSearchChange) onSearchChange(val);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-1.5 bg-[#fbf9fc] border border-[#eadff6] hover:border-[#9065d5]/50 focus:border-[#9065d5] focus:outline-none focus:ring-1 focus:ring-[#9065d5] rounded-xl text-xs text-[#2f243a] transition-all"
            />
          </form>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Mobile Search Button */}
        <button className="md:hidden p-2 text-mf-text-muted hover:text-mf-text hover:bg-mf-bg-soft rounded-lg transition-colors">
          <Search className="size-4" />
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "relative p-2 text-mf-text-muted hover:text-mf-text transition-colors rounded-lg hover:bg-mf-bg-soft",
              isOpen && "text-[#9065d5] bg-mf-bg-soft"
            )}
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#eadff6] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-[#eadff6] flex items-center justify-between">
                <span className="text-xs font-bold text-[#2f243a]">Recent Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-[#f8f1ff] text-[#9065d5] border-[#eadff6] font-bold">
                    {unreadCount} new
                  </Badge>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-[#eadff6]/50">
                {isLoading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-[#9065d5]" />
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => {
                    const ItemIcon = getIconForType(notification.type);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => {
                          if (notification.link) {
                            navigate(notification.link);
                          } else {
                            navigate("/app/notifications");
                          }
                          setIsOpen(false);
                        }}
                        className={cn(
                          "p-3.5 flex gap-3 text-left transition-colors cursor-pointer hover:bg-[#fcfaff]",
                          !notification.isRead && "bg-[#fcfaff]/60"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg border h-fit text-xs shrink-0 mt-0.5",
                          !notification.isRead ? "bg-[#f8f1ff] text-[#9065d5] border-[#eadff6]" : "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                          <ItemIcon className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-1 items-start">
                            <p className={cn("text-xs font-semibold truncate", !notification.isRead ? "text-[#2f243a]" : "text-[#5f5270]")}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => void handleMarkAsRead(notification.id, e)}
                                className="text-[10px] text-[#9065d5] hover:underline shrink-0"
                              >
                                Read
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8a7a99] line-clamp-2 mt-0.5 leading-normal">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-[#8a7a99]">
                    No recent notifications
                  </div>
                )}
              </div>

              <Link
                to="/app/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center py-2.5 bg-[#fbf9fc] hover:bg-[#f8f1ff] border-t border-[#eadff6] text-xs font-semibold text-[#9065d5] transition-colors"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>

        <UserButton />
      </div>
    </header>
  );
}
