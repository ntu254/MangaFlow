import { NotificationDropdown, useNotificationsUnreadCount } from "@/features/notifications";
import { getPersistedAuthUser, isBoardChair, ROLE_LABEL, useAuth } from "@/shared/auth";
import { NAV_BY_ROLE } from "@/shared/config/navigation";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  BookOpen,
  ChartNoAxesCombined,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  Layers,
  ListChecks,
  LogOut,
  Menu,
  Monitor,
  Newspaper,
  ReceiptText,
  TriangleAlert,
  Upload,
  UserRound,
  Vote,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!getPersistedAuthUser()) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Server-derived count, so the badge stays right past the first loaded page.
  const unread = useNotificationsUnreadCount();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => desktop.matches && setMobileNavOpen(false);
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

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
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <div className="grid min-h-screen lg:grid-cols-[232px_1fr]">
          <SheetContent
            side="left"
            className="flex w-[280px] flex-col gap-0 bg-[#faf7ef] p-0 lg:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Workspace navigation and account actions</SheetDescription>
            </SheetHeader>
            <Link to="/" className="flex border-b border-[#d8d2c5]/40 px-6 py-6">
              <span className="font-serif text-[29px] font-semibold uppercase leading-[0.86] tracking-[0.04em] text-[#071225]">
                MangaFlow <span className="block">Studio</span>
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
                          <SheetClose asChild>
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
                          </SheetClose>
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
                  type="button"
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
          </SheetContent>
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

          <div className="flex min-h-screen min-w-0 flex-col">
            <header className="sticky top-0 z-40 flex h-16 min-w-0 items-center justify-between gap-3 border-b border-[#d8d2c5] bg-[#faf7ef]/90 px-4 backdrop-blur-md sm:px-6">
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open navigation"
                  className="grid size-9 shrink-0 place-items-center rounded text-[#071225] hover:bg-[#e9e1d2] lg:hidden"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              {isAdmin ? (
                <nav className="flex min-w-0 flex-1 items-center gap-3 font-serif text-[14px] text-[#071225]">
                  <Link to={dashboardPath} className="shrink-0 hover:text-[#8e1d1d]">
                    {ROLE_LABEL[user.role]}
                  </Link>
                  <span className="shrink-0 text-[#a19c90]">&gt;</span>
                  <span className="min-w-0 truncate">{titleFromPath(location.pathname)}</span>
                </nav>
              ) : (
                <nav className="flex min-w-0 flex-1 items-center gap-3 font-serif text-[14px] text-[#071225]">
                  <Link to={dashboardPath} className="shrink-0 hover:text-[#8e1d1d]">
                    {ROLE_LABEL[user.role]}
                  </Link>
                  <span className="shrink-0 text-[#a19c90]">&gt;</span>
                  <span className="min-w-0 truncate">{titleFromPath(location.pathname)}</span>
                </nav>
              )}
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <NotificationDropdown notificationPath={notificationPath} />
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
              className={
                isAdmin
                  ? "min-w-0 flex-1 bg-[#faf7ef] bg-paper-grain p-0"
                  : "min-w-0 flex-1 p-4 sm:p-6 lg:p-10"
              }
            >
              <Outlet />
            </main>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function getNavIcon(label: string) {
  // Shared / common
  if (label === "Dashboard") return Gauge;
  if (label === "Notifications") return Bell;
  if (label === "Rankings") return ChartNoAxesCombined;

  // Admin
  if (label === "Users") return UserRound;
  if (label === "Rate Table") return ReceiptText;
  if (label === "Material Library") return Database;

  // Mangaka
  if (label === "Proposals") return FileText;
  if (label === "My Series") return BookOpen;
  if (label === "Review Queue") return ClipboardCheck;

  // Assistant
  if (label === "My Tasks") return ClipboardList;
  if (label === "Earnings") return ReceiptText;

  // Editor
  if (label === "Proposal Reviews") return ClipboardCheck;
  if (label === "Series Monitor") return Monitor;
  if (label === "Publications") return Newspaper;

  // Board
  if (label === "Board Review") return ListChecks;
  if (label === "Decision History") return CheckSquare;

  // Misc legacy
  if (label === "Task Board") return Layers;
  if (label === "Ranking Import") return Upload;
  if (label === "At-risk Reviews") return TriangleAlert;
  if (label === "Payroll") return ReceiptText;

  return Bell;
}

function titleFromPath(pathname: string) {
  const leaf = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
  return leaf
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
