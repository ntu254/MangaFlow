import { Link } from "react-router-dom"
import {
  Users,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileText,
  ArrowUpRight,
  Settings,
  Crown,
  Workflow,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { Panel } from "@/components/shared/Panel"
import { StatTile } from "@/components/shared/StatTile"
import { StatusBadge, RoleBadge } from "@/components/shared/StatusBadge"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

const STATS = [
  { label: "Total users", value: "84", unit: "accounts", delta: { value: "+6 this week", trend: "up" as const }, icon: Users, tone: "violet" as const },
  { label: "Active sessions", value: "32", unit: "live", hint: "in the last hour", icon: Activity, tone: "blue" as const },
  { label: "Pending invites", value: "5", unit: "queued", hint: "to onboard", icon: FileText, tone: "amber" as const },
  { label: "Board quorum", value: "7", unit: "/ 9 seats", hint: "majority + 1", icon: Shield, emphasis: true },
]

const ROLE_DISTRIBUTION = [
  { role: "Mangaka", count: 22, share: 26, color: "bg-violet-500" },
  { role: "Assistant", count: 31, share: 37, color: "bg-blue-500" },
  { role: "Editor", count: 12, share: 14, color: "bg-purple-500" },
  { role: "Board", count: 9, share: 11, color: "bg-orange-500" },
  { role: "Admin", count: 4, share: 5, color: "bg-slate-700" },
  { role: "Suspended", count: 6, share: 7, color: "bg-rose-400" },
]

const PENDING = [
  { id: 1, label: "5 user invites awaiting first sign-in", to: "/app/admin/users", tone: "amber", icon: <AlertTriangle size={14} /> },
  { id: 2, label: "1 board seat is vacant — quorum at risk", to: "/app/admin/board-members", tone: "rose", icon: <AlertTriangle size={14} /> },
  { id: 3, label: "2 task types missing default rates", to: "/app/admin/task-types", tone: "amber", icon: <Settings size={14} /> },
  { id: 4, label: "12 audit events flagged for review", to: "/app/admin/audit-log", tone: "blue", icon: <FileText size={14} /> },
]

const ACTIVITY = [
  { time: "09:42", who: "Akira S.", initials: "AS", action: "Promoted to", target: "Editor", role: "EDITOR" as const, tone: "purple" },
  { time: "09:21", who: "Mika T.", initials: "MT", action: "Submitted proposal", target: "Hanami Code §1", tone: "violet" },
  { time: "08:58", who: "System", initials: "SY", action: "Suspended account", target: "user-1842 · brute-force", tone: "rose" },
  { time: "08:30", who: "Board · Ito", initials: "BI", action: "Voted APPROVE on", target: "Twilight Run Vol.3", tone: "orange" },
  { time: "07:54", who: "Admin · Naoko", initials: "NA", action: "Created task type", target: "Inking · Region", tone: "slate" },
]

const AVATAR_TONE: Record<string, string> = {
  purple: "bg-purple-100 text-purple-700",
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
  orange: "bg-orange-100 text-orange-700",
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
}

const HEALTH = [
  { label: "Tasks overdue", value: "4", state: "WARNING", note: "vs 7 last wk" },
  { label: "Avg review", value: "1.9d", state: "OK", note: "↓ 12%" },
  { label: "Failed uploads", value: "0", state: "OK", note: "last 24h" },
  { label: "API errors", value: "0.2%", state: "OK", note: "within SLA" },
  { label: "AI segmentation", value: "98.4%", state: "OK", note: "accuracy" },
]

export default function AdminDashboard() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <PageHeader
        eyebrow="Admin · Control room"
        title="Studio overview"
        description={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Here's the pulse of MangaFlow — accounts, governance, production health and audit signals.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/admin/audit-log" data-testid="admin-audit-link">
                <FileText size={14} /> Audit log
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/admin/users/create" data-testid="admin-invite-link">
                <Plus size={14} /> Invite member
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <StatTile key={s.label} {...s} testId={`admin-stat-${i}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Role distribution */}
        <Panel
          eyebrow="Composition"
          title="Roles in residence"
          description="Active accounts · last 30 days"
          icon={<Users size={16} />}
          className="lg:col-span-7"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/admin/users" data-testid="admin-view-users">
                Manage users <ArrowUpRight size={12} />
              </Link>
            </Button>
          }
        >
          <ul className="space-y-3">
            {ROLE_DISTRIBUTION.map((r) => (
              <li key={r.role} className="flex items-center gap-4">
                <div className="w-24 shrink-0 text-sm font-medium text-foreground">
                  {r.role}
                </div>
                <div className="relative h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn("absolute inset-y-0 left-0 rounded-full", r.color)}
                    style={{ width: `${Math.min(r.share * 2.5, 100)}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-medium num">{r.count}</div>
                <div className="w-12 text-right text-xs text-muted-foreground num">{r.share}%</div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Pending actions */}
        <Panel
          eyebrow="Needs attention"
          title="Pending actions"
          description="Highest-priority items"
          icon={<AlertTriangle size={16} />}
          className="lg:col-span-5"
        >
          <ul className="space-y-2">
            {PENDING.map((p) => (
              <li key={p.id}>
                <Link
                  to={p.to}
                  data-testid={`admin-pending-${p.id}`}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-background px-3.5 py-3 hover:border-violet-300 hover:shadow-soft transition-all"
                >
                  <span className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    p.tone === "rose"
                      ? "bg-rose-100 text-rose-700"
                      : p.tone === "amber"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                  )}>
                    {p.icon}
                  </span>
                  <div className="flex-1 text-sm leading-snug text-foreground">
                    {p.label}
                  </div>
                  <ChevronRight
                    size={14}
                    className="mt-1 text-muted-foreground group-hover:text-primary"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Production health */}
        <Panel
          eyebrow="Health"
          title="Production signals"
          description="System-wide KPIs · auto-refreshed every 60s"
          icon={<Activity size={16} />}
          className="lg:col-span-8"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {HEALTH.map((h) => (
              <div key={h.label} className="rounded-lg border border-border bg-background p-3.5">
                <div className="text-[11px] font-medium text-muted-foreground">{h.label}</div>
                <div className="mt-2 text-xl font-semibold num">{h.value}</div>
                <div className="mt-2 inline-flex items-center gap-1.5">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    h.state === "OK" ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                  <span className="text-[10px] font-medium text-muted-foreground">{h.note}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Recent activity */}
        <Panel
          eyebrow="Audit"
          title="Recent activity"
          description="Last events in the system"
          icon={<FileText size={16} />}
          className="lg:col-span-4"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/admin/audit-log">
                View log <ArrowUpRight size={12} />
              </Link>
            </Button>
          }
        >
          <ul className="space-y-3.5">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  AVATAR_TONE[a.tone]
                )}>
                  {a.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-snug text-foreground">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    {a.role ? (
                      <span className="inline-flex align-middle ml-0.5">
                        <RoleBadge role={a.role} />
                      </span>
                    ) : (
                      <span className="font-medium">{a.target}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground num">{a.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Board governance + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Panel
          eyebrow="Board"
          title="Editorial board governance"
          description="Quorum, chair and decision throughput this quarter"
          icon={<Crown size={16} />}
          className="lg:col-span-7"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Chair</div>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white text-xs font-semibold">
                    KW
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">Kenji Watanabe</div>
                    <div className="text-[11px] text-muted-foreground">Term 24–26</div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quorum</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold num">7</span>
                  <span className="text-sm text-muted-foreground">/ 9 seats</span>
                </div>
                <div className="mt-2"><StatusBadge status="APPROVED" /></div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Decisions Q1</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold num">28</span>
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 text-emerald-700 px-1 py-0.5 text-[10px] font-medium">
                    <TrendingUp size={10} /> +18%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Approved", v: 18, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
                { l: "Needs revision", v: 7, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
                { l: "Rejected", v: 3, bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
              ].map((c) => (
                <div key={c.l} className={cn("rounded-lg border p-3", c.bg, c.border)}>
                  <div className={cn("text-[10px] font-semibold uppercase tracking-wider", c.text)}>{c.l}</div>
                  <div className="mt-1.5 text-2xl font-semibold num text-foreground">{c.v}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          eyebrow="Quick actions"
          title="Common admin tasks"
          icon={<Workflow size={16} />}
          className="lg:col-span-5"
        >
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "Invite user",     to: "/app/admin/users/create",   icon: Plus,     tone: "violet" },
              { l: "Manage users",    to: "/app/admin/users",          icon: Users,    tone: "blue" },
              { l: "Board members",   to: "/app/admin/board-members",  icon: Shield,   tone: "orange" },
              { l: "Task types",      to: "/app/admin/task-types",     icon: Settings, tone: "amber" },
              { l: "Workflow rules",  to: "/app/admin/audit-log",      icon: Workflow, tone: "purple" },
              { l: "Audit log",       to: "/app/admin/audit-log",      icon: FileText, tone: "slate" },
            ].map((a) => (
              <Link
                key={a.l}
                to={a.to}
                data-testid={`admin-quick-${a.l.toLowerCase().replace(/\s+/g, "-")}`}
                className="group flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 hover:border-violet-300 hover:shadow-soft transition-all"
              >
                <span className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg",
                  AVATAR_TONE[a.tone]
                )}>
                  <a.icon size={14} />
                </span>
                <span className="text-sm font-medium text-foreground">{a.l}</span>
                <ArrowUpRight size={12} className="ml-auto text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
