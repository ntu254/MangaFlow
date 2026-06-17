import { Link } from "react-router-dom"
import {
  FileText,
  Layers,
  MessageSquare,
  CheckSquare,
  ArrowUpRight,
  Clock,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { Panel } from "@/components/shared/Panel"
import { StatTile } from "@/components/shared/StatTile"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

const STATS = [
  { label: "Manuscripts", value: "3", unit: "to review", icon: FileText, tone: "violet" as const },
  { label: "Chapters", value: "6", unit: "in review", icon: Layers, tone: "blue" as const },
  { label: "Open comments", value: "14", unit: "threads", icon: MessageSquare, tone: "amber" as const },
  { label: "Approved · week", value: "8", unit: "this wk", icon: CheckSquare, emphasis: true },
]

const QUEUE = [
  { id: "MS-1042", title: "Hanami Code · Chapter 04", mangaka: "Mika Tanaka", initials: "MT", submitted: "2h ago", status: "EDITOR_REVIEW" as const, flags: 3, pages: 28 },
  { id: "MS-1041", title: "Twilight Run · Chapter 02 — cover", mangaka: "Kenji Ueda", initials: "KU", submitted: "5h ago", status: "EDITOR_REVIEW" as const, flags: 0, pages: 1 },
  { id: "MS-1039", title: "Silent Tides · Proposal", mangaka: "Aoi Mori", initials: "AM", submitted: "Yesterday", status: "SUBMITTED" as const, flags: 0, pages: 12 },
]

const COMMENTS = [
  { who: "Mika T.", initials: "MT", tone: "violet", body: "Replied to your tone note on p.12 — adjusted highlights.", time: "12m" },
  { who: "Yuto K.", initials: "YK", tone: "blue", body: "Re-submitted bg pass v3 for region T-2837.", time: "1h" },
  { who: "Board · Itō", initials: "BI", tone: "orange", body: "Flagged pacing of pages 18–22, please review.", time: "yesterday" },
]

const AVATAR_TONE: Record<string, string> = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-orange-100 text-orange-700",
}

export default function EditorDashboard() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-8" data-testid="editor-dashboard">
      <PageHeader
        eyebrow="Tantou Editor · Editorial desk"
        title={<>Today on the desk, <span className="gradient-violet">{user?.name?.split(" ")[0] ?? "Editor"}</span></>}
        description="Manuscripts, chapters and conversations waiting on a careful eye. Open something — the studio is watching the clock."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/editor/comments" data-testid="editor-comments-link">
                <MessageSquare size={14} /> Comments
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/editor/manuscripts" data-testid="editor-manuscripts-link">
                <FileText size={14} /> Open queue
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <StatTile key={s.label} {...s} testId={`editor-stat-${i}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Panel
          eyebrow="Review queue"
          title="Manuscripts awaiting your call"
          description="Sorted by submission time"
          icon={<FileText size={16} />}
          className="lg:col-span-8"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/editor/manuscripts">
                See all <ArrowUpRight size={12} />
              </Link>
            </Button>
          }
        >
          <ul className="space-y-3">
            {QUEUE.map((q) => (
              <li
                key={q.id}
                data-testid={`editor-queue-${q.id}`}
                className="group rounded-lg border border-border bg-background p-4 hover:border-violet-300 hover:shadow-soft transition-all"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-semibold">
                    {q.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-medium text-muted-foreground">
                        {q.id}
                      </span>
                      <StatusBadge status={q.status} />
                      {q.flags > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          {q.flags} flags
                        </span>
                      )}
                    </div>
                    <h4 className="mt-2 text-sm font-semibold leading-tight tracking-tight">
                      {q.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {q.mangaka} · {q.pages} pp · submitted {q.submitted}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    <Button variant="outline" size="sm">
                      <Eye size={12} /> Preview
                    </Button>
                    <Button size="sm">Review</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          eyebrow="Conversations"
          title="Latest replies"
          description="Comment threads & re-submissions"
          icon={<MessageSquare size={16} />}
          className="lg:col-span-4"
        >
          <ul className="space-y-4">
            {COMMENTS.map((c, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  AVATAR_TONE[c.tone]
                )}>
                  {c.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">{c.who}</span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                      <Clock size={10} /> {c.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                    {c.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
