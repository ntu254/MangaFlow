import { Link } from "react-router-dom"
import {
  Plus,
  ArrowUpRight,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  PenLine,
  Sparkles,
  MessageSquare,
  Wallet,
  Trophy,
  ChevronRight,
  Inbox,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { Panel } from "@/components/shared/Panel"
import { StatTile } from "@/components/shared/StatTile"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

const NEXT_ACTIONS = [
  {
    eyebrow: "Editor wants revision",
    title: "Hanami Code · Ch. 04",
    note: "3 panels flagged on page 12-14",
    cta: "Open notes",
    href: "/app/mangaka/series/hanami-code",
    tone: "amber",
    icon: <AlertTriangle size={14} />,
  },
  {
    eyebrow: "Awaiting your approval",
    title: "Twilight Run · Ink pass · p.06",
    note: "Assistant Yuto submitted v2",
    cta: "Review submission",
    href: "/app/mangaka/series/twilight-run",
    tone: "blue",
    icon: <CheckCircle2 size={14} />,
  },
  {
    eyebrow: "Board decision",
    title: "Silent Tides · Proposal",
    note: "Vote closes in 2 days · 5/7 cast",
    cta: "Track vote",
    href: "/app/mangaka/inbox",
    tone: "violet",
    icon: <Trophy size={14} />,
  },
] as const

const TONE_BG: Record<string, string> = {
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
}

const STATS = [
  { label: "Active series", value: "3", hint: "1 ongoing · 2 in proposal", icon: BookOpen, tone: "violet" as const },
  { label: "Pages this week", value: "18", unit: "shipped", delta: { value: "+4 vs last week", trend: "up" as const }, icon: TrendingUp, tone: "emerald" as const },
  { label: "Open revisions", value: "4", hint: "across 2 chapters", icon: AlertTriangle, tone: "amber" as const },
  { label: "Earnings · May", value: "¥482k", hint: "to be confirmed", icon: Wallet, emphasis: true },
]

const PIPELINE = [
  {
    title: "Hanami Code",
    status: "ONGOING" as const,
    chapter: "Ch. 04",
    progress: 78,
    next: "Lettering · 6 pages remaining",
    due: "Fri, May 31",
  },
  {
    title: "Twilight Run",
    status: "EDITOR_REVIEW" as const,
    chapter: "Ch. 02 — submitted",
    progress: 100,
    next: "Awaiting Editor Itō",
    due: "Reply by Wed",
  },
  {
    title: "Silent Tides",
    status: "BOARD_REVIEW" as const,
    chapter: "Proposal",
    progress: 60,
    next: "Board vote 5/7",
    due: "Closes Jun 02",
  },
]

const DUE_SOON = [
  { date: "May", day: "28", label: "Hanami Code · Inking final", tone: "amber" as const, hours: "in 2 days" },
  { date: "May", day: "30", label: "Twilight Run · Cover redraw", tone: "blue" as const, hours: "in 4 days" },
  { date: "Jun", day: "02", label: "Silent Tides · Board response", tone: "violet" as const, hours: "in 7 days" },
  { date: "Jun", day: "05", label: "Payroll confirm · 8 assistants", tone: "emerald" as const, hours: "in 10 days" },
]

const DUE_TONE: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const TIMELINE = [
  { t: "10m", who: "Editor Itō", body: "Approved Ch.02 cover. Tagged 3 panels for tone.", initials: "IS", tone: "purple" },
  { t: "1h", who: "Assistant Yuto", body: "Submitted backgrounds for Hanami p.14-16.", initials: "YK", tone: "blue" },
  { t: "3h", who: "Board · Chair", body: "Opened vote on Silent Tides proposal.", initials: "KW", tone: "orange" },
  { t: "yesterday", who: "Reader analytics", body: "Twilight Run +12% week-over-week.", initials: "RA", tone: "emerald" },
]

const AVATAR_TONE: Record<string, string> = {
  purple: "bg-purple-100 text-purple-700",
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-orange-100 text-orange-700",
  emerald: "bg-emerald-100 text-emerald-700",
}

const RANKING = [
  { title: "Twilight Run", rank: 4, prev: 6, score: 84.2 },
  { title: "Hanami Code", rank: 12, prev: 11, score: 71.0 },
  { title: "Silent Tides", rank: null, prev: null, score: null },
]

export default function MangakaDashboard() {
  const { user } = useAuthStore()
  const today = new Date()

  return (
    <div className="space-y-8" data-testid="mangaka-dashboard">
      <PageHeader
        eyebrow="Mangaka · Production hub"
        title={
          <>
            Welcome back, <span className="gradient-violet">{user?.name?.split(" ")[0] ?? "Mika"}.</span>
          </>
        }
        description="Your production command center. Today's work across every series — all in one calm panel."
        actions={
          <>
            <div className="hidden md:inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 h-10 text-xs font-medium text-muted-foreground shadow-soft">
              <Calendar size={14} className="text-primary" />
              {today.toLocaleString("en-US", { weekday: "long", month: "short", day: "2-digit" })}
            </div>
            <Button variant="outline" asChild>
              <Link to="/app/mangaka/inbox" data-testid="mangaka-inbox-link">
                <Inbox size={14} /> Inbox
                <span className="inline-flex items-center justify-center rounded-md bg-rose-100 text-rose-700 px-1.5 h-5 text-[11px] font-semibold">6</span>
              </Link>
            </Button>
            <Button asChild data-testid="mangaka-new-series-link">
              <Link to="/app/mangaka/series/create">
                <Plus size={14} /> New series
              </Link>
            </Button>
          </>
        }
      />

      {/* NEXT ACTIONS */}
      <section data-testid="mangaka-next-actions">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Next, in your hands</p>
            <h2 className="text-lg font-semibold tracking-tight">Three things to look at first</h2>
          </div>
          <Link
            to="/app/mangaka/inbox"
            className="text-sm font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1"
          >
            See all <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NEXT_ACTIONS.map((a, i) => (
            <Link
              key={a.title}
              to={a.href}
              data-testid={`mangaka-next-${a.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              className="surface-interactive group relative rounded-xl border border-border bg-card p-5 shadow-soft reveal"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cn("grid h-9 w-9 place-items-center rounded-lg", TONE_BG[a.tone])}>
                  {a.icon}
                </span>
                <ArrowUpRight
                  size={14}
                  className="text-muted-foreground transition-all group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {a.eyebrow}
              </p>
              <h3 className="mt-1 text-base font-semibold leading-snug tracking-tight">
                {a.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{a.note}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {a.cta} <ChevronRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <StatTile key={s.label} {...s} testId={`mangaka-stat-${i}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Active series pipeline */}
        <Panel
          eyebrow="Production"
          title="Active series pipeline"
          description="Where each project sits in the production loop"
          icon={<BookOpen size={16} />}
          className="lg:col-span-8"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/mangaka/series" data-testid="mangaka-view-series">
                All series <ArrowUpRight size={12} />
              </Link>
            </Button>
          }
        >
          <ul className="space-y-4">
            {PIPELINE.map((p) => (
              <li
                key={p.title}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center"
              >
                <div className="sm:w-1/3 min-w-0">
                  <h4 className="text-sm font-semibold leading-tight tracking-tight">
                    {p.title}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <span className="text-xs text-muted-foreground">
                      {p.chapter}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="relative h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium num text-foreground w-10 text-right">
                      {p.progress}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{p.next}</p>
                </div>

                <div className="sm:w-32 sm:text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Due
                  </div>
                  <div className="mt-0.5 text-sm font-medium num">{p.due}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Current chapter focus */}
        <Panel
          eyebrow="In focus"
          title="Hanami Code · Ch. 04"
          description="Lettering pass · 22 of 28 pages"
          icon={<PenLine size={16} />}
          className="lg:col-span-4"
        >
          <div className="space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-gradient-to-br from-violet-100 via-fuchsia-50 to-rose-50">
              <div className="absolute inset-0 bg-dots opacity-50" aria-hidden />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-700/70">
                  Chapter 04
                </span>
                <h4 className="text-xl font-semibold leading-tight tracking-tight text-violet-900">
                  "The petals fell"
                </h4>
                <p className="text-xs text-violet-700/70">Hanami Code</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-border bg-card/90 backdrop-blur px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">22 / 28 p.</span>
                <StatusBadge status="IN_PRODUCTION" />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Overall progress</span>
                <span className="font-medium num">78%</span>
              </div>
              <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  style={{ width: "78%" }}
                />
              </div>
            </div>

            <Button variant="soft" className="w-full" asChild>
              <Link to="/app/mangaka/series/hanami-code">
                Open page studio <ArrowUpRight size={14} />
              </Link>
            </Button>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Due soon */}
        <Panel
          eyebrow="Due soon"
          title="On your desk this week"
          icon={<Clock size={16} />}
          className="lg:col-span-5"
        >
          <ul className="space-y-2">
            {DUE_SOON.map((d, i) => (
              <li
                key={i}
                className="flex items-center gap-4 rounded-lg border border-border bg-background p-3 hover:bg-slate-50 transition-colors"
              >
                <div className={cn(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-lg border text-center",
                  DUE_TONE[d.tone]
                )}>
                  <div className="leading-none">
                    <div className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
                      {d.date}
                    </div>
                    <div className="mt-0.5 text-lg font-semibold num">{d.day}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug truncate">{d.label}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} /> {d.hours}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </li>
            ))}
          </ul>
        </Panel>

        {/* Activity timeline */}
        <Panel
          eyebrow="Activity"
          title="Around your series"
          icon={<MessageSquare size={16} />}
          className="lg:col-span-4"
        >
          <ul className="space-y-4">
            {TIMELINE.map((t, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  AVATAR_TONE[t.tone]
                )}>
                  {t.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">{t.who}</span>
                    <span className="text-[11px] text-muted-foreground">· {t.t}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                    {t.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Ranking */}
        <Panel
          eyebrow="Ranking"
          title="Reader pulse"
          description="This week vs last"
          icon={<Trophy size={16} />}
          className="lg:col-span-3"
        >
          <ul className="space-y-3">
            {RANKING.map((r) => (
              <li
                key={r.title}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground num">
                    Score · {r.score ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold num">
                    {r.rank ? `#${r.rank}` : "—"}
                  </span>
                  {typeof r.rank === "number" && typeof r.prev === "number" && r.rank < r.prev && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 text-emerald-700 px-1 py-0.5 text-[10px] font-medium">
                      <TrendingUp size={10} /> {r.prev - r.rank}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
            <Link to="/app/mangaka/ranking">View ranking <ArrowUpRight size={12} /></Link>
          </Button>
        </Panel>
      </div>

      {/* Payroll banner */}
      <section className="relative overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-rose-50 p-6 sm:p-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-soft">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-300/30 blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-fuchsia-300/30 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Payroll · May</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            ¥ 482,000 <span className="text-sm font-normal text-muted-foreground">to confirm by Jun 05</span>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            8 assistants pending your confirmation · 2 ready to pay
          </p>
        </div>
        <div className="relative flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/mangaka/payroll">
              <Wallet size={14} /> Review payroll
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/mangaka/payroll">
              Confirm all <CheckCircle2 size={14} />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
