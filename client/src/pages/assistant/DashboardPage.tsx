import { Link } from "react-router-dom"
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Wallet,
  Upload,
  ArrowUpRight,
  Sparkles,
  Filter,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { Panel } from "@/components/shared/Panel"
import { StatTile } from "@/components/shared/StatTile"
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

const STATS = [
  { label: "Active tasks", value: "4", unit: "in hand", icon: CheckSquare, tone: "blue" as const },
  { label: "Due today", value: "2", hint: "before 18:00", icon: Clock, tone: "amber" as const },
  { label: "Overdue", value: "0", hint: "all clear ✨", icon: AlertTriangle, tone: "emerald" as const },
  { label: "Earnings · May", value: "320", unit: "pts", icon: Wallet, emphasis: true },
]

const TASKS = [
  { id: "T-2841", title: "Background tone · Hanami Code p.14", series: "Hanami Code", priority: "URGENT" as const, status: "IN_PROGRESS" as const, due: "Today · 18:00", rate: "40 pts", revision: 0 },
  { id: "T-2840", title: "Region inking · Twilight Run p.06 — bg-2", series: "Twilight Run", priority: "HIGH" as const, status: "TODO" as const, due: "Tomorrow", rate: "25 pts", revision: 0 },
  { id: "T-2837", title: "Tone gradient pass · Hanami Code p.12", series: "Hanami Code", priority: "MEDIUM" as const, status: "REVISION_REQUESTED" as const, due: "May 30", rate: "30 pts · +rev", revision: 1 },
  { id: "T-2820", title: "Lettering placement · Silent Tides p.02", series: "Silent Tides", priority: "LOW" as const, status: "SUBMITTED" as const, due: "Submitted", rate: "20 pts", revision: 0 },
]

const EARNINGS_WEEKS = [
  { w: "Wk 18", v: 65 },
  { w: "Wk 19", v: 80 },
  { w: "Wk 20", v: 55 },
  { w: "Wk 21", v: 95 },
  { w: "Wk 22", v: 25 },
]

export default function AssistantDashboard() {
  const { user } = useAuthStore()
  const max = Math.max(...EARNINGS_WEEKS.map((e) => e.v))

  return (
    <div className="space-y-8" data-testid="assistant-dashboard">
      <PageHeader
        eyebrow="Assistant · Workshop"
        title={<>On the desk for <span className="gradient-violet">{user?.name?.split(" ")[0] ?? "you"}</span></>}
        description="Tasks assigned to you across every series. Submit early, keep revisions low — your bonus follows the craft."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/assistant/earnings" data-testid="assistant-earnings-link">
                <Wallet size={14} /> Earnings ledger
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/assistant/tasks" data-testid="assistant-tasks-link">
                <CheckSquare size={14} /> All tasks
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <StatTile key={s.label} {...s} testId={`assistant-stat-${i}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Panel
          eyebrow="Today's queue"
          title="Tasks in hand"
          description="Sorted by priority and due time"
          icon={<CheckSquare size={16} />}
          className="lg:col-span-8"
          action={
            <Button variant="ghost" size="sm">
              <Filter size={12} /> Filter
            </Button>
          }
        >
          <ul className="space-y-3">
            {TASKS.map((t) => (
              <li
                key={t.id}
                data-testid={`assistant-task-${t.id}`}
                className="group rounded-lg border border-border bg-background p-4 hover:border-violet-300 hover:shadow-soft transition-all"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-medium text-muted-foreground">
                        {t.id}
                      </span>
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                      {t.revision > 0 && (
                        <span className="text-[11px] font-medium text-rose-600">
                          · Revision round {t.revision}
                        </span>
                      )}
                    </div>
                    <h4 className="mt-2 text-sm font-semibold leading-tight tracking-tight">
                      {t.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.series} · Due {t.due} · <span className="font-medium text-foreground">{t.rate}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Button variant="outline" size="sm">
                      Open studio
                    </Button>
                    <Button size="sm">
                      <Upload size={12} /> Submit
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          eyebrow="Earnings"
          title="Weekly trend"
          description="Points earned · last 5 weeks"
          icon={<TrendingUp size={16} />}
          className="lg:col-span-4"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/assistant/earnings">
                Ledger <ArrowUpRight size={12} />
              </Link>
            </Button>
          }
        >
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold num text-foreground">320</span>
                <span className="text-sm text-muted-foreground">points · May</span>
              </div>
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <TrendingUp size={11} /> +14% vs April
              </p>
            </div>

            <div className="flex items-end gap-2 h-32">
              {EARNINGS_WEEKS.map((e, i) => (
                <div key={e.w} className="flex flex-col items-center gap-2 flex-1">
                  <div className="relative w-full bg-slate-100 h-full rounded-md overflow-hidden">
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 rounded-b-md",
                        i === EARNINGS_WEEKS.length - 1
                          ? "bg-gradient-to-t from-violet-500 to-fuchsia-500"
                          : "bg-slate-300"
                      )}
                      style={{ height: `${(e.v / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {e.w}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-fuchsia-50 border border-fuchsia-200 px-3 py-2.5">
              <Sparkles size={14} className="text-fuchsia-600 shrink-0" />
              <p className="text-xs text-fuchsia-900">
                Submit revision-free to unlock a <span className="font-semibold">+10% craft bonus</span>.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
