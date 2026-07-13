import { useCommentsQuery, useMyChaptersQuery, useMySeriesQuery } from "@/entities/series";
import { DeadlineRiskPill, ReviewStatusPill } from "@/entities/submission";
import { useMarkAllReadMutation, useNotificationsQuery } from "@/features/notifications";
import { useProposalsQuery } from "@/features/proposals";
import { useEditorReviewQueueQuery } from "@/features/series";
import { useAuth } from "@/shared/auth";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import { StatCard } from "@/shared/ui/stat-card";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  Check,
  FileText,
  Image,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { Panel } from "@/shared/ui";
import {
  buildReviewQueue,
  buildSubmissionReviewItems,
  chaptersForEditor,
  getDeadlineRisk,
  getPublicationReadiness,
  seriesForEditor,
} from "../../model/editor-access";

export function EditorDashboard() {
  const user = useAuth((s) => s.user);
  const { data: proposals = [] } = useProposalsQuery();
  const { data: series = [] } = useMySeriesQuery();
  const { data: chapters = [] } = useMyChaptersQuery();
  const { data: comments = [] } = useCommentsQuery({});
  const { data: notifItems = [] } = useNotificationsQuery();
  const { data: liveSubmissions = [] } = useEditorReviewQueueQuery();

  const submissionItems = useMemo(
    () => buildSubmissionReviewItems(liveSubmissions),
    [liveSubmissions],
  );

  const queue = useMemo(
    () => (user ? buildReviewQueue(proposals, chapters, series, comments, user.id) : []),
    [proposals, chapters, series, comments, user],
  );

  const allItems = useMemo(() => [...submissionItems, ...queue], [submissionItems, queue]);

  const mySeries = useMemo(() => (user ? seriesForEditor(series, user.id) : []), [series, user]);
  const myChapters = useMemo(
    () => (user ? chaptersForEditor(chapters, series, user.id) : []),
    [chapters, series, user],
  );

  const counts = useMemo(() => {
    const pendingProposal = allItems.filter(
      (q) => q.kind === "PROPOSAL_PACKAGE" || q.kind === "PROPOSAL",
    ).length;
    const storyboard = allItems.filter((q) => q.kind === "STORYBOARD").length;
    const chapter = allItems.filter((q) => q.kind === "CHAPTER").length;
    const submission = submissionItems.length;
    const deadlineRisk = myChapters.filter((c) => getDeadlineRisk(c).tone === "rose").length;
    const ready = myChapters.filter((c) => getPublicationReadiness(c, comments).ready).length;
    return { pendingProposal, storyboard, chapter, submission, deadlineRisk, ready };
  }, [allItems, submissionItems, myChapters, comments]);

  const myNotifs = useMemo(
    () => (user ? notifItems.filter((n) => n.userId === user.id && !n.archivedAt).slice(0, 6) : []),
    [notifItems, user],
  );

  const myUnreadNotifs = useMemo(
    () =>
      user ? notifItems.filter((n) => n.userId === user.id && !n.archivedAt && !n.readAt) : [],
    [notifItems, user],
  );

  const markAllReadMutation = useMarkAllReadMutation();

  const handleMarkAllEditorNotifsRead = async () => {
    if (myUnreadNotifs.length === 0) return;
    try {
      const result = await markAllReadMutation.mutateAsync({
        notificationIds: myUnreadNotifs.map((n) => n.id),
      });
      if (result.errorCount > 0) {
        console.error(`${result.errorCount} editor notifications could not be marked as read`);
      }
    } catch (error) {
      console.error("Error marking editor notifications as read:", error);
    }
  };

  if (!user) return null;

  const focus = allItems.slice(0, 5);
  const deadlineRows = [...myChapters]
    .filter((c) => c.status !== "PUBLISHED")
    .sort((a, b) => (a.reviewDueAt ?? "").localeCompare(b.reviewDueAt ?? ""))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Editor workspace
          </p>
          <h1 className="mt-1 font-serif text-3xl">
            Today, <span className="italic">{user.name.split(" ")[1] ?? user.name}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allItems.length} items need review ({counts.submission} submissions live) ·{" "}
            {counts.deadlineRisk} series have deadline risk · {counts.ready} chapters ready for
            publication
          </p>
        </div>
        <Link
          to="/app/editor/review"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
        >
          Open Review Queue <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {myUnreadNotifs.length > 0 ? (
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={handleMarkAllEditorNotifsRead}
            disabled={myUnreadNotifs.length === 0 || markAllReadMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40"
          >
            <Check className="size-3.5" /> Mark all as read
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<Send className="size-4" />}
          tone="blue"
          label="Submissions (live)"
          value={counts.submission}
          hint="Mangaka approved"
        />
        <StatCard
          icon={<FileText className="size-4" />}
          tone="amber"
          label="Proposal packages"
          value={counts.pendingProposal}
        />
        <StatCard
          icon={<Image className="size-4" />}
          tone="violet"
          label="Storyboard"
          value={counts.storyboard}
        />
        <StatCard
          icon={<MessageSquare className="size-4" />}
          tone="sky"
          label="Chapter"
          value={counts.chapter}
        />
        <StatCard
          icon={<CalendarClock className="size-4" />}
          tone="rose"
          label="Deadline risk"
          value={counts.deadlineRisk}
        />
        <StatCard
          icon={<Sparkles className="size-4" />}
          tone="emerald"
          label="Publish ready"
          value={counts.ready}
        />
      </div>

      <Panel
        title="Today review focus"
        description="Items requiring your editorial attention today."
      >
        {focus.length === 0 ? (
          <p className="text-xs text-muted-foreground">No items need review</p>
        ) : (
          <ul className="space-y-2">
            {focus.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 rounded border border-border bg-background/60 p-2.5 text-xs"
              >
                <ReviewStatusPill status={it.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{it.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {it.kind} · {it.submittedBy} · {formatDateTime(it.submittedAt)}
                  </p>
                </div>
                <Link
                  to="/app/editor/review"
                  className="shrink-0 rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background hover:opacity-90"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Deadline risk"
        description="Chapters approaching or past their review deadline."
      >
        {deadlineRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">You have not been assigned any series yet</p>
        ) : (
          <ul className="divide-y divide-border">
            {deadlineRows.map((c) => {
              const s = mySeries.find((x) => x.id === c.seriesId);
              const risk = getDeadlineRisk(c);
              return (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {s?.title} — Ch.{c.number}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.assigneeName} · {c.reviewDueAt ? formatDate(c.reviewDueAt) : "—"}
                    </p>
                  </div>
                  <DeadlineRiskPill risk={risk} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Recent activity" description="Latest editorial notifications and updates.">
        {myNotifs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No new notifications</p>
        ) : (
          <ul className="divide-y divide-border">
            {myNotifs.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.readAt ? (
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
