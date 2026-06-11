export type Role = "board" | "editor"

export type Tone = "primary" | "success" | "warning" | "danger" | "neutral"

export interface MetricItem {
  id: string
  label: string
  value: string
  tone: Tone
  icon: string
}

export interface QueueItem {
  id: string
  title: string
  subtitle: string
  value?: string
  tone: Tone
}

export interface SeriesCard {
  id: string
  title: string
  subtitle: string
  meta: string
  status: string
  tone: Tone
  progress?: string
  progressValue?: number
  coverTone: "violet" | "red" | "blue" | "dark" | "warm" | "mono"
}

export interface ActivityItem {
  id: string
  title: string
  time: string
  tone: Tone
}

export const boardMetrics: MetricItem[] = [
  { id: "waiting", label: "Waiting", value: "4", tone: "primary", icon: "Q" },
  { id: "tie", label: "Tie-break", value: "1", tone: "warning", icon: "T" },
  { id: "risk", label: "At-risk", value: "3", tone: "danger", icon: "!" },
]

export const boardDecisionCards: MetricItem[] = [
  { id: "vote", label: "Vote on series", value: "4", tone: "primary", icon: "V" },
  { id: "tie", label: "Tie-break required", value: "1", tone: "warning", icon: "T" },
  { id: "risk", label: "Review at-risk titles", value: "3", tone: "danger", icon: "!" },
  { id: "ranking", label: "Finalize ranking", value: "1", tone: "primary", icon: "R" },
]

export const boardQueues: QueueItem[] = [
  { id: "series", title: "Series Waiting Review", subtitle: "Proposals awaiting board review", value: "4", tone: "primary" },
  { id: "tie", title: "Tie-break Decisions", subtitle: "Requires Board Chair resolution", value: "1", tone: "warning" },
  { id: "risk", title: "At-risk Cases", subtitle: "Series flagged for attention", value: "3", tone: "danger" },
  { id: "ranking", title: "Ranking Cycle", subtitle: "Current cycle: Monthly Ranking", value: "1", tone: "primary" },
]

export const boardSeries: SeriesCard[] = [
  { id: "neon", title: "Neon Reverie", subtitle: "Sci-Fi / Drama", meta: "Proposed: Monthly", status: "Approve", tone: "success", progress: "4 / 7 votes submitted", progressValue: 0.57, coverTone: "violet" },
  { id: "aurora", title: "Aurora Pulse", subtitle: "Fantasy / Adventure", meta: "Proposed: Monthly", status: "Needs Revision", tone: "warning", progress: "3 / 7 votes submitted", progressValue: 0.43, coverTone: "blue" },
  { id: "crimson", title: "Crimson Road", subtitle: "Action / Historical", meta: "Proposed: Weekly", status: "Approve", tone: "success", progress: "6 / 7 votes submitted", progressValue: 0.86, coverTone: "red" },
  { id: "shadow", title: "Shadowline", subtitle: "Thriller / Mystery", meta: "Proposed: Monthly", status: "At Risk", tone: "danger", progress: "1 / 7 votes submitted", progressValue: 0.14, coverTone: "dark" },
]

export const atRiskTitles: SeriesCard[] = [
  { id: "shadow-risk", title: "Shadowline", subtitle: "Current rank 12, reader score 6.1", meta: "Down 5 places", status: "At Risk", tone: "danger", coverTone: "dark" },
  { id: "crimson-risk", title: "Crimson Road", subtitle: "Current rank 18, reader score 6.3", meta: "Down 7 places", status: "At Risk", tone: "danger", coverTone: "red" },
  { id: "aurora-risk", title: "Aurora Pulse", subtitle: "Current rank 25, reader score 6.4", meta: "Down 6 places", status: "At Risk", tone: "danger", coverTone: "blue" },
]

export const boardActivity: ActivityItem[] = [
  { id: "approved", title: "You finalized Aurora Pulse as Approved", time: "2h ago", tone: "success" },
  { id: "ranking", title: "Monthly Ranking Cycle started", time: "6h ago", tone: "primary" },
  { id: "tie", title: "You resolved a tie vote for Crimson Road", time: "1d ago", tone: "warning" },
  { id: "risk", title: "You flagged Shadowline as At Risk", time: "2d ago", tone: "danger" },
]

export const editorActions: MetricItem[] = [
  { id: "manuscripts", label: "Review manuscripts", value: "3", tone: "primary", icon: "M" },
  { id: "approvals", label: "Final approve submissions", value: "5", tone: "success", icon: "A" },
  { id: "comments", label: "Resolve comments", value: "4", tone: "warning", icon: "C" },
  { id: "blocked", label: "Check blocked chapters", value: "2", tone: "danger", icon: "B" },
]

export const editorQueues: QueueItem[] = [
  { id: "manuscripts", title: "Manuscripts Waiting", subtitle: "New submissions awaiting review", value: "3", tone: "primary" },
  { id: "final", title: "Final Approval Queue", subtitle: "Ready for your final approval", value: "5", tone: "success" },
  { id: "comments", title: "Comments Blocking Publication", subtitle: "Unresolved comments", value: "4", tone: "warning" },
  { id: "readiness", title: "Readiness Alerts", subtitle: "Chapters at risk or blocked", value: "2", tone: "danger" },
]

export const manuscripts: SeriesCard[] = [
  { id: "eclipse", title: "Eclipse of Eternity", subtitle: "Fantasy / Dark / Action", meta: "Version 1.4, submitted 18m ago", status: "Waiting Review", tone: "primary", coverTone: "dark" },
  { id: "neon-manuscript", title: "Neon Reverie", subtitle: "Sci-Fi / Psychological / Drama", meta: "Version 2.1, submitted 1h ago", status: "Revision Uploaded", tone: "warning", coverTone: "violet" },
  { id: "lotus", title: "Crimson Lotus", subtitle: "Historical / Romance / Drama", meta: "Version 3.0, submitted 3h ago", status: "Needs Editor Decision", tone: "danger", coverTone: "red" },
  { id: "flavors", title: "Flavors of Youth", subtitle: "Slice of Life / Romance / Food", meta: "Version 1.2, submitted 5h ago", status: "Ready to Forward", tone: "success", coverTone: "warm" },
]

export const finalApprovals: SeriesCard[] = [
  { id: "inking", title: "Page 12 Inking", subtitle: "Eclipse of Eternity / Ch. 12", meta: "Assistant: Yuki Tanaka", status: "Urgent", tone: "danger", coverTone: "mono" },
  { id: "lettering", title: "Bubble lettering", subtitle: "Neon Reverie / Ch. 8", meta: "Assistant: Haru K.", status: "Waiting", tone: "warning", coverTone: "mono" },
  { id: "cleanup", title: "Cleanup pass", subtitle: "Crimson Lotus / Ch. 7", meta: "Assistant: Mei Lin", status: "Blocked", tone: "danger", coverTone: "mono" },
  { id: "tone", title: "Tone shading", subtitle: "Aurora Pulse / Ch. 3", meta: "Assistant: Sora Aoki", status: "Approved Today", tone: "success", coverTone: "mono" },
]

export const readinessChecks: QueueItem[] = [
  { id: "pages", title: "All pages uploaded", subtitle: "Page files are present", value: "Passed", tone: "success" },
  { id: "tasks", title: "All tasks approved", subtitle: "Assistant work is approved", value: "Passed", tone: "success" },
  { id: "submissions", title: "All submissions approved", subtitle: "Mangaka and editor chain complete", value: "Passed", tone: "success" },
  { id: "comments", title: "All comments resolved", subtitle: "2 comments still block publication", value: "Failed", tone: "danger" },
  { id: "editor", title: "Editor final approval exists", subtitle: "Final approval was recorded", value: "Passed", tone: "success" },
  { id: "date", title: "Publication date exists", subtitle: "Schedule has not been selected", value: "Failed", tone: "danger" },
]

export const editorActivity: ActivityItem[] = [
  { id: "approve", title: "You approved Ch.11 of Eclipse of Eternity", time: "18m ago", tone: "success" },
  { id: "comments", title: "2 new comments on Ch.10 - Dawn of Ashes", time: "1h ago", tone: "warning" },
  { id: "submission", title: "New submission: Shikkoku no Tenshi / Ch.7", time: "2h ago", tone: "primary" },
  { id: "blocked", title: "Ch.8 of Crimson Lotus is blocked", time: "3h ago", tone: "danger" },
]

export function toneCount(items: Array<{ tone: Tone }>, tone: Tone): number {
  return items.filter((item) => item.tone === tone).length
}

