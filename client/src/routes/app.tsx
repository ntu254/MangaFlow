import { useNotificationsQuery } from "@/features/notifications";
import { isBoardChair, ROLE_LABEL, useAuth } from "@/shared/auth";
import { NAV_BY_ROLE } from "@/shared/config/navigation";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  Bell,
  ChartNoAxesCombined,
  ClipboardList,
  Gauge,
  ListChecks,
  LogOut,
  ReceiptText,
  Settings,
  TriangleAlert,
  Upload,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("beachread-auth");
    if (!raw) throw redirect({ to: "/login" });
    try {
      const parsed = JSON.parse(raw) as { state?: { user?: unknown } };
      if (!parsed.state?.user) throw redirect({ to: "/login" });
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: notifItems = [] } = useNotificationsQuery();
  const unread = notifItems.filter((n) => !n.readAt && !n.archivedAt).length;

  if (!user) {
    // SSR fallback before client hydration
    return null;
  }

  const nav = NAV_BY_ROLE[user.role].filter((item) => {
    if (!item.minRole) return true;
    if (user.role === "admin") return true;
    if (item.minRole === "admin" && user.role === "board" && isBoardChair(user.id)) return true;
    return false;
  });
  const isAdmin = user.role === "admin";
  const dashboardPath = nav.find((item) => item.label === "Dashboard")?.to ?? "/app/dashboard";
  const notificationPath =
    nav.find((item) => item.label === "Notifications")?.to ?? "/app/notifications";
  const grouped = nav.reduce<Record<string, typeof nav>>((acc, item) => {
    const k = item.group ?? "Workspace";
    acc[k] = acc[k] ?? [];
    acc[k].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background bg-paper-grain" suppressHydrationWarning>
      <div className="grid min-h-screen lg:grid-cols-[232px_1fr]">
        <aside
          className="hidden sticky top-0 h-screen border-r border-[#d8d2c5] lg:flex lg:flex-col lg:bg-bottom lg:bg-no-repeat lg:bg-cover"
          style={{ backgroundImage: "url(/siderbar-background.png)" }}
        >
          <Link
            to="/"
            className="flex h-[116px] items-start gap-2.5 border-b border-[#d8d2c5]/40 px-6 py-6"
          >
            <span className="font-serif text-[29px] font-semibold uppercase leading-[0.86] tracking-[0.04em] text-[#071225]">
              Manga
              <br />
              Flow
            </span>
          </Link>
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-6">
                <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b887f]">
                  {group}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active =
                      location.pathname === item.to ||
                      (item.to !== "/app/dashboard" && location.pathname.startsWith(item.to));
                    const Icon = getNavIcon(item.label);
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={`flex h-9 items-center gap-2.5 rounded-[6px] px-3 text-[12px] font-semibold transition-colors ${
                            active
                              ? "bg-[#071225]/80 text-[#f8f3e9] shadow-sm"
                              : "text-[#1b2433] hover:bg-[#e9e1d2]/60"
                          }`}
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-[#d8d2c5]/40 bg-[#f5f0e6]/90 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-full bg-[#071225] text-[11px] font-bold text-[#f8f3e9]">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#071225]">{user.name}</p>
                <p className="text-[11px] text-[#6c6a62]">{ROLE_LABEL[user.role]}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
                aria-label="Logout"
                className="grid size-8 place-items-center rounded text-[#071225] hover:bg-[#e9e1d2]"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#d8d2c5] bg-[#faf7ef]/90 px-6 backdrop-blur-md">
            {isAdmin ? (
              <nav className="flex items-center gap-3 font-serif text-[14px] text-[#071225]">
                <Link to={dashboardPath} className="hover:text-[#8e1d1d]">
                  {ROLE_LABEL[user.role]}
                </Link>
                <span className="text-[#a19c90]">&gt;</span>
                <span>{titleFromPath(location.pathname)}</span>
              </nav>
            ) : (
              <nav className="flex items-center gap-3 font-serif text-[14px] text-[#071225]">
                <Link to={dashboardPath} className="hover:text-[#8e1d1d]">
                  {ROLE_LABEL[user.role]}
                </Link>
                <span className="text-[#a19c90]">&gt;</span>
                <span>{titleFromPath(location.pathname)}</span>
              </nav>
            )}
            <div className="flex items-center gap-3">
              <Link
                to={notificationPath}
                className="relative grid size-9 place-items-center border-r border-[#d8d2c5] text-[#071225] hover:text-[#8e1d1d]"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {unread > 0 ? (
                  <span className="absolute right-1 top-2 size-2 rounded-full bg-[#d62f2f] text-[0px]">
                    {unread}
                  </span>
                ) : null}
              </Link>
              {isAdmin ? (
                <div className="flex items-center gap-3 pl-3">
                  <div className="grid size-9 place-items-center rounded-full bg-[#071225] text-[11px] font-bold text-[#f8f3e9]">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[13px] font-semibold leading-tight text-[#071225]">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[#6c6a62]">{ROLE_LABEL[user.role]}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-3">
                  <div className="grid size-9 place-items-center rounded-full bg-[#071225] text-[11px] font-bold text-[#f8f3e9]">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[13px] font-semibold leading-tight text-[#071225]">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[#6c6a62]">{ROLE_LABEL[user.role]}</p>
                  </div>
                </div>
              )}
            </div>
          </header>
          <main
            className={isAdmin ? "flex-1 bg-[#faf7ef] bg-paper-grain p-0" : "flex-1 p-6 lg:p-10"}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function getNavIcon(label: string) {
  if (label === "Dashboard") return Gauge;
  if (label === "Users") return UserRound;
  if (label === "Earnings") return ReceiptText;
  if (label === "Settings") return Settings;
  if (label === "Task Board" || label === "My Tasks") return ClipboardList;
  if (label === "Review Queue" || label === "Board Queue") return ListChecks;
  if (label === "Rankings") return ChartNoAxesCombined;
  if (label === "Ranking Import") return Upload;
  if (label === "At-risk Reviews") return TriangleAlert;
  if (label === "Notifications") return Bell;
  return Bell;
}

function titleFromPath(pathname: string) {
  const leaf = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
  return leaf
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
