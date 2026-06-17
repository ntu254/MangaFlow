import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Plus,
  Search,
  ArrowUpRight,
  LayoutGrid,
  Rows3,
  X,
  PenLine,
  Users,
  AlertTriangle,
  BookOpen,
  Calendar,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { StatTile } from "@/components/shared/StatTile"
import { EmptyState } from "@/components/shared/EmptyState"
import type { SeriesStatus } from "@/types"
import { cn } from "@/lib/utils"

type SeriesMock = {
  id: string
  title: string
  subtitle: string
  status: SeriesStatus
  genres: string[]
  audience: string
  chapters: number
  pages: number
  members: number
  rank: number | null
  updatedAt: string
  coverLabel: string
  gradient: string
}

const SERIES: SeriesMock[] = [
  { id: "hanami-code",   title: "Hanami Code",   subtitle: "A coder's reverie of falling petals and broken time loops.", status: "ONGOING",            genres: ["Sci-fi", "Slice of life"], audience: "Seinen", chapters: 4,  pages: 112, members: 5, rank: 12,   updatedAt: "2 hours ago", coverLabel: "Ch. 04",   gradient: "from-rose-300 via-pink-200 to-amber-200" },
  { id: "twilight-run",  title: "Twilight Run",  subtitle: "Night couriers race the law across a neon Tokyo.",          status: "EDITOR_REVIEW",      genres: ["Action", "Thriller"],      audience: "Shonen", chapters: 2,  pages: 58,  members: 6, rank: 4,    updatedAt: "5 hours ago", coverLabel: "Ch. 02",   gradient: "from-violet-400 via-fuchsia-300 to-blue-300" },
  { id: "silent-tides",  title: "Silent Tides",  subtitle: "A diver who hears the ghosts of every wreck.",              status: "BOARD_REVIEW",       genres: ["Mystery", "Supernatural"], audience: "Josei",  chapters: 0,  pages: 12,  members: 2, rank: null, updatedAt: "yesterday",   coverLabel: "Vol. 0",   gradient: "from-cyan-300 via-teal-200 to-emerald-200" },
  { id: "iron-wing",     title: "Iron Wing",     subtitle: "Mech pilots vs. their own teen anxieties.",                 status: "AT_RISK",            genres: ["Mecha", "Drama"],          audience: "Shonen", chapters: 28, pages: 612, members: 4, rank: 28,   updatedAt: "3 days ago",  coverLabel: "Vol. 03",  gradient: "from-amber-300 via-orange-300 to-rose-300" },
  { id: "sumi-ghost",    title: "Sumi Ghost",    subtitle: "An ink yokai recovers stolen calligraphy across Edo.",      status: "DRAFT",              genres: ["Historical", "Fantasy"],   audience: "Seinen", chapters: 0,  pages: 0,   members: 1, rank: null, updatedAt: "5 days ago",  coverLabel: "Draft",    gradient: "from-slate-300 via-zinc-200 to-stone-200" },
  { id: "neon-bridge",   title: "Neon Bridge",   subtitle: "A pop idol pilots a cargo zeppelin between cities.",        status: "REVISION_REQUESTED", genres: ["Music", "Adventure"],      audience: "Shojo",  chapters: 6,  pages: 168, members: 3, rank: 22,   updatedAt: "1 week ago",  coverLabel: "Ch. 06",   gradient: "from-fuchsia-300 via-pink-300 to-violet-300" },
]

type StatusFilter = "ALL" | SeriesStatus
type Sort = "RECENT" | "TITLE" | "PAGES"

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "EDITOR_REVIEW", label: "Editor review" },
  { value: "REVISION_REQUESTED", label: "Revision" },
  { value: "BOARD_REVIEW", label: "Board review" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "AT_RISK", label: "At risk" },
]

export default function MangakaSeriesPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const [sort, setSort] = useState<Sort>("RECENT")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SERIES.filter((s) => {
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.genres.some((g) => g.toLowerCase().includes(q))
      const matchesStatus = status === "ALL" || s.status === status
      return matchesSearch && matchesStatus
    }).sort((a, b) => {
      if (sort === "TITLE") return a.title.localeCompare(b.title)
      if (sort === "PAGES") return b.pages - a.pages
      return 0
    })
  }, [search, status, sort])

  const drafts = SERIES.filter((s) => s.status === "DRAFT").length
  const ongoing = SERIES.filter((s) => s.status === "ONGOING").length
  const inReview = SERIES.filter((s) =>
    ["EDITOR_REVIEW", "BOARD_REVIEW", "REVISION_REQUESTED"].includes(s.status)
  ).length
  const atRisk = SERIES.filter((s) => s.status === "AT_RISK").length

  const hasFilters = search.trim() !== "" || status !== "ALL"

  return (
    <div className="space-y-8" data-testid="mangaka-series-page">
      <PageHeader
        eyebrow="Mangaka · Library"
        title="My series"
        description="Drafts, proposals and active productions. Track every project's place in the publishing journey."
        actions={
          <Button asChild data-testid="series-new-button">
            <Link to="/app/mangaka/series/create">
              <Plus size={14} /> New series
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Drafts" value={drafts} hint="not yet submitted" icon={PenLine} tone="default" />
        <StatTile label="In review" value={inReview} hint="editor or board" icon={Users} tone="blue" />
        <StatTile label="Ongoing" value={ongoing} hint="active production" icon={Calendar} tone="emerald" />
        <StatTile label="At risk" value={atRisk} hint="needs attention" icon={AlertTriangle} tone={atRisk > 0 ? "amber" : "default"} emphasis={atRisk > 0} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              data-testid={`series-filter-${opt.value.toLowerCase()}`}
              className={cn(
                "rounded-md px-3 h-8 text-xs font-medium transition-colors",
                status === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search title, genre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="series-search-input"
              className="h-9 pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            data-testid="series-sort"
          >
            <option value="RECENT">Recent</option>
            <option value="TITLE">Title A→Z</option>
            <option value="PAGES">Pages ↓</option>
          </select>
          <div className="flex rounded-lg border border-border bg-card shadow-soft p-0.5">
            <button
              onClick={() => setView("grid")}
              data-testid="series-view-grid"
              className={cn(
                "h-8 w-8 grid place-items-center rounded-md transition-colors",
                view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView("list")}
              data-testid="series-view-list"
              className={cn(
                "h-8 w-8 grid place-items-center rounded-md transition-colors",
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="List view"
            >
              <Rows3 size={14} />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={20} />}
          title={hasFilters ? "No series match those filters" : "Your shelf is empty"}
          description={
            hasFilters
              ? "Try clearing the search and status filters to see all of your work."
              : "Start by drafting your first series proposal — the editor's desk is waiting."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setStatus("ALL")
                }}
              >
                <Filter size={14} /> Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link to="/app/mangaka/series/create">
                  <Plus size={14} /> Draft a series
                </Link>
              </Button>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <SeriesCard
              key={s.id}
              series={s}
              onClick={() => navigate(`/app/mangaka/series/${s.id}`)}
              animationDelay={i * 60}
            />
          ))}
        </div>
      ) : (
        <SeriesListView items={filtered} onOpen={(id) => navigate(`/app/mangaka/series/${id}`)} />
      )}
    </div>
  )
}

function SeriesCard({
  series,
  onClick,
  animationDelay,
}: {
  series: SeriesMock
  onClick: () => void
  animationDelay: number
}) {
  return (
    <article
      onClick={onClick}
      data-testid={`series-card-${series.id}`}
      className="surface-interactive group relative rounded-xl border border-border bg-card shadow-soft overflow-hidden reveal flex flex-col"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Cover */}
      <div className={cn("relative aspect-[3/4] overflow-hidden bg-gradient-to-br", series.gradient)}>
        <div className="absolute inset-0 bg-dots opacity-50" aria-hidden />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700/80">
            {series.coverLabel}
          </span>
          <h3 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900">
            {series.title}
          </h3>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={series.status} />
        </div>
        <div className="absolute top-3 left-3">
          <span className="inline-flex rounded-md bg-white/70 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-slate-700">
            {series.audience}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="text-sm leading-snug text-muted-foreground line-clamp-2">
          {series.subtitle}
        </p>
        <div className="flex flex-wrap gap-1">
          {series.genres.map((g) => (
            <span
              key={g}
              className="rounded-md border border-border bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
            >
              {g}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="num">
            {series.chapters} ch · {series.pages} pp
          </span>
          <span>Updated {series.updatedAt}</span>
        </div>
      </div>
    </article>
  )
}

function SeriesListView({
  items,
  onOpen,
}: {
  items: SeriesMock[]
  onOpen: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="hidden sm:grid grid-cols-[1.4fr_140px_160px_100px_120px_120px_40px] gap-4 border-b border-border bg-slate-50/70 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Title</span>
        <span>Status</span>
        <span>Genres</span>
        <span>Pages</span>
        <span>Members</span>
        <span>Updated</span>
        <span aria-hidden />
      </div>
      <ul className="divide-y divide-border">
        {items.map((s) => (
          <li
            key={s.id}
            onClick={() => onOpen(s.id)}
            data-testid={`series-row-${s.id}`}
            className="group grid cursor-pointer grid-cols-1 gap-1 px-5 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[1.4fr_140px_160px_100px_120px_120px_40px] sm:items-center sm:gap-4"
          >
            <div className="min-w-0 flex items-center gap-3">
              <div className={cn("h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br", s.gradient)} />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold leading-tight tracking-tight truncate">{s.title}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{s.subtitle}</p>
              </div>
            </div>
            <div><StatusBadge status={s.status} /></div>
            <div className="flex flex-wrap gap-1">
              {s.genres.slice(0, 2).map((g) => (
                <span key={g} className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-border">
                  {g}
                </span>
              ))}
            </div>
            <div className="text-sm font-medium num">{s.pages}</div>
            <div className="text-sm font-medium num">{s.members}</div>
            <div className="text-xs text-muted-foreground">{s.updatedAt}</div>
            <ArrowUpRight
              size={14}
              className="text-muted-foreground transition-all group-hover:text-primary"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
