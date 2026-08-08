import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Inbox,
  Layers,
  MessageSquare,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/shared/auth";
import { useCommentsQuery, useMyChaptersQuery, useMySeriesQuery } from "@/entities/series";
import { DeadlineRiskPill, ReviewStatusPill } from "@/entities/submission";
import { useMarkAllReadMutation, useNotificationsQuery } from "@/features/notifications";
import { useProposalsQuery } from "@/features/proposals";
import { useEditorReviewQueueQuery } from "@/features/series";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import {
  buildReviewQueue,
  buildSubmissionReviewItems,
  chaptersForEditor,
  getDeadlineRisk,
  getPublicationReadiness,
  seriesForEditor,
  type ReviewItem,
} from "../../model/editor-access";

function formatKindLabel(kind: string) {
  if (kind === "PROPOSAL_PACKAGE" || kind === "PROPOSAL") return "Proposal Package";
  if (kind === "CHAPTER") return "Chapter Manuscript";
  if (kind === "STORYBOARD") return "Storyboard Draft";
  if (kind === "SUBMISSION") return "Assistant Artwork";
  return kind;
}

export function EditorDashboard() {
  const user = useAuth((s) => s.user);
  const { data: proposals = [] } = useProposalsQuery();
  const { data: series = [] } = useMySeriesQuery();
  const { data: chapters = [] } = useMyChaptersQuery();
  const { data: comments = [] } = useCommentsQuery({});
  const { data: notifItems = [] } = useNotificationsQuery();
  const { data: liveSubmissions = [] } = useEditorReviewQueueQuery();

  const [triageFilter, setTriageFilter] = useState<"ALL" | "URGENT" | "TODAY" | "READY">("ALL");

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
    const chapter = allItems.filter((q) => q.kind === "CHAPTER" || q.kind === "STORYBOARD").length;
    const submission = submissionItems.length;
    const deadlineRisk = myChapters.filter((c) => getDeadlineRisk(c).tone === "rose").length;
    const ready = myChapters.filter((c) => getPublicationReadiness(c, comments).ready).length;
    const published = myChapters.filter((c) => c.status === "PUBLISHED" || c.status === "READY_FOR_PUBLICATION").length;
    return { pendingProposal, chapter, submission, deadlineRisk, ready, published };
  }, [allItems, submissionItems, myChapters, comments]);

  const triagedItems = useMemo(() => {
    const urgent = allItems.filter(
      (it) => it.priority === "BLOCKING" || it.priority === "HIGH" || it.revisionReturned,
    );
    const today = allItems.filter(
      (it) => it.priority !== "BLOCKING" && !it.isCompleted,
    );
    const ready = myChapters.filter((c) => getPublicationReadiness(c, comments).ready);

    return { urgent, today, ready };
  }, [allItems, myChapters, comments]);

  const publishedReleases = useMemo(() => {
    return myChapters
      .filter((c) => c.status === "PUBLISHED" || c.status === "READY_FOR_PUBLICATION")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [myChapters]);

  const displayedQueue = useMemo(() => {
    if (triageFilter === "URGENT") return triagedItems.urgent;
    if (triageFilter === "TODAY") return triagedItems.today;
    return allItems;
  }, [allItems, triageFilter, triagedItems]);

  const myNotifs = useMemo(
    () => (user ? notifItems.filter((n) => n.userId === user.id).slice(0, 5) : []),
    [notifItems, user],
  );

  const myUnreadNotifs = useMemo(
    () => (user ? notifItems.filter((n) => n.userId === user.id && !n.readAt) : []),
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

  const firstName = user.name ? user.name.split(" ")[1] ?? user.name.split(" ")[0] : "Editor";
  const focusQueue = displayedQueue.slice(0, 6);
  const deadlineRows = [...myChapters]
    .filter((c) => c.status !== "PUBLISHED")
    .sort((a, b) => (a.reviewDueAt ?? "").localeCompare(b.reviewDueAt ?? ""))
    .slice(0, 5);

  const getItemTargetLink = (it: ReviewItem) => {
    if ((it.kind === "PROPOSAL_PACKAGE" || it.kind === "PROPOSAL") && it.refId) {
      return { to: "/app/editor/proposals/$proposalId" as const, params: { proposalId: it.refId } };
    }
    if ((it.kind === "CHAPTER" || it.kind === "STORYBOARD") && it.refId) {
      return { to: "/app/editor/chapters/$chapterId/review" as const, params: { chapterId: it.refId } };
    }
    return { to: "/app/editor/review" as const, params: {} };
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Executive Editor Header */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Editorial Workspace, {firstName} ✒️
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {allItems.length} review items awaiting action · {counts.published} chapters published · {mySeries.length} active series assigned
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {myUnreadNotifs.length > 0 && (
            <button
              onClick={handleMarkAllEditorNotifsRead}
              disabled={markAllReadMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground shadow-2xs hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Check className="size-3.5" /> Clear {myUnreadNotifs.length} Unread
            </button>
          )}

          <Link
            to="/app/editor/review"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-4 py-2 text-xs font-bold text-foreground shadow-2xs hover:bg-muted hover:border-primary/40 transition-all"
          >
            Open Full Review Queue <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Urgent Deadline Risk Alert Banner */}
      {counts.deadlineRisk > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-900 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {counts.deadlineRisk} Series Chapter{counts.deadlineRisk > 1 ? "s" : ""} Facing Deadline Risk
              </p>
              <p className="text-[11px] text-rose-800 dark:text-rose-300">
                Editorial action is required to clear review blockers and prevent publication delays.
              </p>
            </div>
          </div>

          <Link
            to="/app/editor/series"
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-800 transition-colors shadow-xs"
          >
            Monitor Series Deadlines <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* 4 Essential KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pending Review</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <Inbox className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{allItems.length}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{counts.pendingProposal} proposals · {counts.chapter} chapters</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Overdue / At Risk</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400">
              <CalendarClock className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{counts.deadlineRisk}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Urgent deadlines</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Published Releases</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{counts.published}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Published & ready</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Assigned Series</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
              <BookOpen className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{mySeries.length}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Active portfolio</p>
        </div>
      </div>

      {/* Main 2-Column Operational Workbench Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3): Operational Review Queue & Published Releases View */}
        <div className="space-y-6 lg:col-span-2">
          {/* Operational Priority Triage Queue Card */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Operational Priority Triage Queue</h3>
              </div>

              {/* Urgency Level Filter Tabs */}
              <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 text-[11px] font-medium border border-border/40 self-start sm:self-auto">
                <button
                  onClick={() => setTriageFilter("ALL")}
                  className={`rounded-md px-2.5 py-0.5 transition-all cursor-pointer ${
                    triageFilter === "ALL"
                      ? "bg-background text-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({allItems.length})
                </button>
                <button
                  onClick={() => setTriageFilter("URGENT")}
                  className={`rounded-md px-2.5 py-0.5 transition-all cursor-pointer ${
                    triageFilter === "URGENT"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🔴 Urgent ({triagedItems.urgent.length})
                </button>
                <button
                  onClick={() => setTriageFilter("TODAY")}
                  className={`rounded-md px-2.5 py-0.5 transition-all cursor-pointer ${
                    triageFilter === "TODAY"
                      ? "bg-background text-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🟡 Today ({triagedItems.today.length})
                </button>
              </div>
            </div>

            {focusQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="mx-auto size-6 text-emerald-500/60 mb-2" />
                No pending items in this category. All caught up!
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-xs">
                {focusQueue.map((it) => {
                  const link = getItemTargetLink(it);
                  const isUrgent = it.priority === "BLOCKING" || it.priority === "HIGH";
                  const displayTitle =
                    (it.kind === "PROPOSAL_PACKAGE" || it.kind === "PROPOSAL") && it.seriesTitle
                      ? `Proposal Package: ${it.seriesTitle}`
                      : it.title;

                  return (
                    <div key={it.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors gap-3">
                      <div className="min-w-0 pr-2 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <ReviewStatusPill status={it.status} />

                          {isUrgent && (
                            <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <ShieldAlert className="size-3" /> High Priority
                            </span>
                          )}

                          {it.claimState === "AVAILABLE" && (
                            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              Available to Claim
                            </span>
                          )}

                          {it.claimState === "CLAIMED_BY_ME" && (
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <UserCheck className="size-3" /> Claimed by You
                            </span>
                          )}

                          <p className="truncate font-bold text-foreground">{displayTitle}</p>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">{formatKindLabel(it.kind)}</span>
                          {it.seriesTitle && !displayTitle.includes(it.seriesTitle) ? ` · ${it.seriesTitle}` : ""} · Submitted by {it.submittedBy} · {formatDateTime(it.submittedAt)}
                        </p>
                      </div>

                      {/* Refined Elegant Action Button */}
                      <Link
                        {...(link as any)}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all self-end sm:self-center"
                      >
                        {it.claimState === "AVAILABLE" ? "Claim & Review" : "Open Review"} <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick View: Recently Published Releases Feed */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-foreground">Recently Published Releases Feed ({counts.published})</h3>
              </div>
              <Link
                to="/app/editor/publications"
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                All Publications <ArrowRight className="size-3" />
              </Link>
            </div>

            {publishedReleases.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No chapters published yet. Verified chapters will appear here once released.
              </div>
            ) : (
              <div className="divide-y divide-border/60 text-xs">
                {publishedReleases.map((c) => {
                  const s = mySeries.find((x) => x.id === c.seriesId);
                  const isPublished = c.status === "PUBLISHED";

                  return (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isPublished
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                            }`}
                          >
                            {isPublished ? "PUBLISHED" : "READY TO RELEASE"}
                          </span>
                          <p className="truncate font-bold text-foreground">
                            {s?.title ?? "Series"} — Ch.{c.number} {c.title ? `: ${c.title}` : ""}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {c.pages.length} pages · Updated {formatDate(c.updatedAt)}
                        </p>
                      </div>

                      <Link
                        to="/app/editor/publications"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-2xs"
                      >
                        View Release <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 Sidebar Radar): Deadline Risk & Editorial Activity */}
        <div className="space-y-6">
          {/* Deadline Risk Radar */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-foreground">Deadline Risk Radar</h3>
              </div>
              <Link
                to="/app/editor/series"
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Monitor <ArrowRight className="size-3" />
              </Link>
            </div>

            {deadlineRows.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No active series deadline risks.
              </p>
            ) : (
              <div className="divide-y divide-border/60 text-xs">
                {deadlineRows.map((c) => {
                  const s = mySeries.find((x) => x.id === c.seriesId);
                  const risk = getDeadlineRisk(c);
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0">
                        <Link
                          to="/app/editor/chapters/$chapterId/review"
                          params={{ chapterId: c.id }}
                          className="truncate font-bold text-foreground hover:text-primary transition-colors block"
                        >
                          {s?.title ?? "Series"} — Ch.{c.number}
                        </Link>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {c.assigneeName} · {c.reviewDueAt ? formatDate(c.reviewDueAt) : "—"}
                        </p>
                      </div>
                      <DeadlineRiskPill risk={risk} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Editorial Activity & Notifications */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-bold text-foreground">
                Notifications & Activity
              </h3>
              {myUnreadNotifs.length > 0 && (
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {myUnreadNotifs.length} New
                </span>
              )}
            </div>

            {myNotifs.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No new notifications</p>
            ) : (
              <div className="divide-y divide-border/60 text-xs">
                {myNotifs.map((n) => (
                  <div key={n.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-foreground font-medium">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.readAt && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
