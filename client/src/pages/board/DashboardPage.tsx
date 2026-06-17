import { Link } from "react-router-dom"
import {
  Vote,
  BookOpen,
  AlertTriangle,
  BarChart2,
  ArrowUpRight,
  Check,
  X,
  Pause,
  Clock,
  Crown,
  Trophy,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { Panel } from "@/components/shared/Panel"
import { StatTile } from "@/components/shared/StatTile"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

const STATS = [
  { label: "Pending votes", value: "2", unit: "to cast", icon: Vote, emphasis: true },
  { label: "Active series", value: "11", hint: "ongoing", icon: BookOpen, tone: "blue" as const },
  { label: "At-risk", value: "1", hint: "needs decision", icon: AlertTriangle, tone: "amber" as const },
  { label: "Avg score", value: "72.4", unit: "/100", icon: BarChart2, tone: "emerald" as const },
]

const VOTING_QUEUE = [
  {
    id: "S-208",
    title: "Silent Tides",
    mangaka: "Aoi Mori",
    initials: "AM",
    type: "Proposal",
    pages: "12 pp draft",
    progress: { yes: 5, no: 1, rev: 0, total: 9 },
    closes: "Jun 02 · in 2 days",
    your: null as "APPROVE" | "REJECT" | "NEEDS_REVISION" | null,
  },
  {
    id: "S-204",
    title: "Iron Wing · Continue?",
    mangaka: "Hideki Aoyama",
    initials: "HA",
    type: "Ranking decision",
    pages: "Ranking #28 · warning",
    progress: { yes: 2, no: 2, rev: 3, total: 9 },
    closes: "Jun 04 · in 4 days",
    your: "NEEDS_REVISION" as const,
  },
]

const AT_RISK = [
  { title: "Iron Wing", rank: 28, prev: 19, status: "AT_RISK" as const, reason: "−9 weeks slipping" },
  { title: "Neon Bridge", rank: 22, prev: 23, status: "ONGOING" as const, reason: "Borderline" },
]

const RANK_BARS = [
  { t: "Twilight Run", v: 84, trend: "up" },
  { t: "Crystal Lake", v: 78, trend: "up" },
  { t: "Hanami Code",  v: 71, trend: "flat" },
  { t: "Sumi Ghost",   v: 64, trend: "down" },
  { t: "Neon Bridge",  v: 49, trend: "down" },
  { t: "Iron Wing",    v: 32, trend: "down" },
]

export default function BoardDashboard() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-8" data-testid="board-dashboard">
      <PageHeader
        eyebrow="Editorial Board · Decision desk"
        title={<>The chamber awaits, <span className="gradient-violet">{user?.name?.split(" ")[0] ?? "Member"}</span></>}
        description="Two proposals, one continuation question, and the ranking pulse of the studio. Cast carefully — every series feels the weight."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/board/ranking" data-testid="board-ranking-link">
                <BarChart2 size={14} /> Ranking
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/board/series" data-testid="board-series-link">
                <Vote size={14} /> Cast votes
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <StatTile key={s.label} {...s} testId={`board-stat-${i}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Panel
          eyebrow="Voting chamber"
          title="Decisions awaiting your vote"
          icon={<Vote size={16} />}
          className="lg:col-span-8"
        >
          <ul className="space-y-4">
            {VOTING_QUEUE.map((v) => {
              const cast = v.progress.yes + v.progress.no + v.progress.rev
              const yesPct = (v.progress.yes / v.progress.total) * 100
              const noPct = (v.progress.no / v.progress.total) * 100
              const revPct = (v.progress.rev / v.progress.total) * 100
              return (
                <li
                  key={v.id}
                  data-testid={`board-vote-${v.id}`}
                  className="rounded-xl border border-border bg-background p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white text-xs font-semibold">
                        {v.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-medium text-muted-foreground">
                            {v.id} · {v.type}
                          </span>
                          <StatusBadge status="BOARD_REVIEW" />
                        </div>
                        <h4 className="mt-1 text-base font-semibold leading-tight tracking-tight">
                          {v.title}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {v.mangaka} · {v.pages}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Closes</div>
                      <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium">
                        <Clock size={12} className="text-amber-600" />
                        {v.closes}
                      </div>
                    </div>
                  </div>

                  {/* Vote progress */}
                  <div className="mt-5">
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="bg-emerald-500" style={{ width: `${yesPct}%` }} />
                      <div className="bg-amber-500" style={{ width: `${revPct}%` }} />
                      <div className="bg-rose-500" style={{ width: `${noPct}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
                      <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {v.progress.yes} approve
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {v.progress.rev} revision
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          {v.progress.no} reject
                        </span>
                      </div>
                      <span className="text-muted-foreground num">{cast}/{v.progress.total} cast</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" variant={v.your === "APPROVE" ? "success" : "outline"} data-testid={`board-vote-approve-${v.id}`}>
                      <Check size={12} /> Approve
                    </Button>
                    <Button size="sm" variant={v.your === "NEEDS_REVISION" ? "default" : "outline"}>
                      <Pause size={12} /> Needs revision
                    </Button>
                    <Button size="sm" variant={v.your === "REJECT" ? "destructive" : "outline"}>
                      <X size={12} /> Reject
                    </Button>
                    <Button variant="ghost" size="sm" className="ml-auto" asChild>
                      <Link to="/app/board/series">
                        Read brief <ArrowUpRight size={12} />
                      </Link>
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel
          eyebrow="At risk"
          title="Series to watch"
          icon={<AlertTriangle size={16} />}
          className="lg:col-span-4"
        >
          <ul className="space-y-3">
            {AT_RISK.map((r) => (
              <li
                key={r.title}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3.5"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold num">#{r.rank}</div>
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
            <Link to="/app/board/at-risk">Open watchlist <ArrowUpRight size={12} /></Link>
          </Button>
        </Panel>
      </div>

      <Panel
        eyebrow="Ranking pulse"
        title="Top of the chart this week"
        description="Reader score · normalized 0–100"
        icon={<Trophy size={16} />}
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/board/ranking">
              Full chart <ArrowUpRight size={12} />
            </Link>
          </Button>
        }
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {RANK_BARS.map((r, i) => (
            <li key={r.t} className="flex items-center gap-3">
              <span className="w-8 text-sm font-semibold num text-muted-foreground">
                #{String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm font-medium truncate flex items-center gap-1.5">
                {r.t}
                {i === 0 && <Crown size={12} className="text-amber-500" />}
              </span>
              <div className="relative h-2 w-32 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    i === 0 ? "bg-gradient-to-r from-orange-400 to-amber-500" : "bg-slate-400"
                  )}
                  style={{ width: `${r.v}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm font-medium num">{r.v}</span>
              <span className="w-4 shrink-0">
                {r.trend === "up" && <TrendingUp size={12} className="text-emerald-600" />}
                {r.trend === "down" && <TrendingDown size={12} className="text-rose-500" />}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
