import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Search } from "lucide-react";
import { ThemeToggle } from "@/shared/ui/site/ThemeToggle";
import { RoleSwitcher } from "@/shared/ui/site/RoleSwitcher";
import { NotificationBell } from "@/shared/ui/site/NotificationBell";
import { useRole } from "@/shared/lib/role";
import { useSeriesSummary } from "@/shared/queries/useSeries";

const LABELS: Record<string, string> = {
  app: "App",
  dashboard: "Dashboard",
  series: "My Series",
  review: "Review queue",
  board: "Board voting",
  tasks: "My tasks",
  submissions: "Submissions",
  publications: "Publications",
  payroll: "Payroll",
  rankings: "Rankings",
  ai: "AI",
  bubble: "Bubble studio",
  admin: "Admin",
  users: "Users",
  roles: "Roles & types",
  settings: "Settings",
  chapters: "Chapters",
  new: "New proposal",
  read: "Reader",
  notifications: "Notifications",
  team: "Team",
  activity: "Activity",
  revisions: "Revisions",
  pages: "Pages",
  upload: "Upload",
  studio: "Page Studio",
  editor: "Editor",
  "series-review": "Series review",
  vote: "Vote",
  proposal: "Proposal",
};

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Skip the "app" prefix to simplify breadcrumbs
  const rawParts = pathname.split("/").filter(Boolean);
  const parts = rawParts[0] === "app" ? rawParts.slice(1) : rawParts;

  const { user, logout, role } = useRole();
  const navigate = useNavigate();

  const seriesId = extractSeriesIdFromPath(rawParts);
  const { data: summary } = useSeriesSummary(seriesId || "");
  const seriesTitle = summary?.series?.title?.trim();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex h-14 items-center gap-4 border-b border-foreground/10 bg-background px-10">
      <nav className="flex items-center text-[13px] text-foreground/60">
        {parts.map((p, i) => {
          const isObjectId = p.length === 24 && /^[0-9a-fA-F]{24}$/.test(p);
          const isSeriesId = !!seriesId && p === seriesId;

          let label = LABELS[p] ?? decodeURIComponent(p);

          if (isSeriesId) {
            label = seriesTitle || "Untitled draft";
            // Truncate if too long
            if (label.length > 30) {
              label = label.substring(0, 30) + "...";
            }
          } else if (isObjectId) {
            label = "Task";
          }

          // We still need the original href which might include /app
          const hrefIndex = rawParts.indexOf(p);
          const href = "/" + rawParts.slice(0, hrefIndex + 1).join("/");
          const isLast = i === parts.length - 1;

          return (
            <span key={href} className="flex items-center">
              {i > 0 && <span className="mx-2 text-foreground/30">/</span>}
              {isLast ? (
                <span
                  className="font-medium text-foreground"
                  title={isSeriesId ? seriesTitle : undefined}
                >
                  {label}
                </span>
              ) : (
                <Link
                  to={href}
                  className="hover:text-foreground"
                  title={isSeriesId ? seriesTitle : undefined}
                >
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex h-8 w-64 items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-3 text-xs text-foreground/60">
        <Search className="h-3.5 w-3.5" />
        <span>Global search…</span>
      </div>

      {/* Demo role switcher: admins only, for previewing other roles' views. */}
      {role === "admin" && <RoleSwitcher />}

      <NotificationBell />
      <ThemeToggle />

      {user && (
        <div className="flex items-center gap-2 border-l border-foreground/10 pl-3">
          <div className="hidden text-right text-xs leading-tight md:block">
            <div className="font-medium text-foreground">{user.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-foreground/55">
              {user.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-foreground/15 bg-foreground/5 text-foreground/70 hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function extractSeriesIdFromPath(rawParts: string[]) {
  const seriesIndex = rawParts.indexOf("series");
  if (seriesIndex < 0) return "";
  const candidate = rawParts[seriesIndex + 1] ?? "";
  return candidate.length === 24 && /^[0-9a-fA-F]{24}$/.test(candidate) ? candidate : "";
}
