import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { ProposalCard } from "@/entities/proposal/ui/proposal-card";
import {
  type Chapter,
  type ProductionSeries,
  type ProductionSeriesStatus,
} from "@/entities/series/model/series-types";
import type { StudioTask } from "@/entities/series/model/studio-types";
import { SeriesCard } from "@/entities/series/ui/series-card";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import {
  mapApiError,
  useMyChaptersQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
  useSubmissionsQuery,
} from "../../api/series-queries";
import { proposalKeys, useProposalsQuery } from "@/features/proposals";
import { deriveProductionSummary } from "../../detail/model/series-production-helpers";
import { apiRequest } from "@/shared/api/client";
import { useAuth } from "@/shared/auth";
import {
  ActionButton,
  EmptyState,
  PageHeader,
  SearchToolbar,
  SectionHeading,
  StateBlock,
  StatCard,
  Surface,
  TextButton,
} from "@/shared/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Eye, FileText, Layers, Plus, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type StatusFilter = ProductionSeriesStatus | "ALL";
type WorkflowFilter = "REVIEW_NEEDED" | "OVERDUE" | "BLOCKED" | "WAITING_EDITOR" | null;

const STATUSES: StatusFilter[] = ["ALL", "PLANNING", "ONGOING", "HIATUS", "COMPLETED", "ARCHIVED"];

const STATUS_LABEL: Record<StatusFilter, string> = {
  ALL: "Tất cả",
  PLANNING: "Planning",
  ONGOING: "Ongoing",
  HIATUS: "Hiatus",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const WORKFLOW_FILTERS: { key: WorkflowFilter; label: string }[] = [
  { key: "REVIEW_NEEDED", label: "Cần review" },
  { key: "OVERDUE", label: "Trễ deadline" },
  { key: "BLOCKED", label: "Bị block" },
  { key: "WAITING_EDITOR", label: "Chờ editor" },
];

function useProposalStatusQuery(proposalId: string | undefined) {
  return useQuery<SeriesProposal | null>({
    queryKey: proposalId ? proposalKeys.detail(proposalId) : ["proposals", "skip"],
    queryFn: () => apiRequest<SeriesProposal>(`/proposals/${proposalId}`),
    enabled: !!proposalId,
    staleTime: 60000,
  });
}

function SeriesCardWrapper({
  series,
  allChapters,
  allTasks,
  allSubmissions,
}: {
  series: ProductionSeries;
  allChapters: Chapter[];
  allTasks: StudioTask[];
  allSubmissions: AssistantSubmission[];
}) {
  const { data: proposal } = useProposalStatusQuery(series.proposalId);
  const chapters = useMemo(
    () => allChapters.filter((c) => c.seriesId === series.id),
    [allChapters, series.id],
  );
  const tasks = useMemo(() => {
    const chapterIds = new Set(chapters.map((c) => c.id));
    return allTasks.filter((t) => chapterIds.has(t.chapterId));
  }, [chapters, allTasks]);
  const submissions = useMemo(() => {
    const chapterIds = new Set(chapters.map((c) => c.id));
    return allSubmissions.filter((s) => s.chapterId && chapterIds.has(s.chapterId));
  }, [chapters, allSubmissions]);

  const summary = useMemo(
    () => deriveProductionSummary(series, chapters, tasks, submissions),
    [series, chapters, tasks, submissions],
  );

  return (
    <SeriesCard
      series={series}
      publishedCount={summary.publishedCount}
      totalCount={chapters.length}
      summary={summary}
      proposalStatus={proposal?.status}
    />
  );
}

export function SeriesListPage() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  const {
    data: proposals = [],
    isLoading: isProposalsLoading,
    refetch: refetchProposals,
  } = useProposalsQuery(user?.role === "mangaka" ? { authorId: user.id } : undefined);
  const {
    data: series = [],
    isLoading: isSeriesLoading,
    isError,
    error,
    refetch: refetchSeries,
  } = useMySeriesQuery();
  const { data: allChapters = [] } = useMyChaptersQuery();
  const { data: allTasks = [] } = useStudioTasksQuery({});
  const { data: allSubmissions = [] } = useSubmissionsQuery({});

  const isLoading = isSeriesLoading || isProposalsLoading;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>(null);
  const [q, setQ] = useState("");

  const refetch = useCallback(async () => {
    await Promise.all([refetchSeries(), refetchProposals()]);
  }, [refetchSeries, refetchProposals]);

  const chapterMap = useMemo(() => {
    const map = new Map<string, Chapter[]>();
    for (const ch of allChapters) {
      const arr = map.get(ch.seriesId) ?? [];
      arr.push(ch);
      map.set(ch.seriesId, arr);
    }
    return map;
  }, [allChapters]);

  const taskMap = useMemo(() => {
    const map = new Map<string, StudioTask[]>();
    const chapterIdsBySeries = new Map<string, Set<string>>();
    for (const [sid, chs] of chapterMap) {
      chapterIdsBySeries.set(sid, new Set(chs.map((c) => c.id)));
    }
    for (const t of allTasks) {
      for (const [sid, cids] of chapterIdsBySeries) {
        if (cids.has(t.chapterId)) {
          const arr = map.get(sid) ?? [];
          arr.push(t);
          map.set(sid, arr);
        }
      }
    }
    return map;
  }, [allTasks, chapterMap]);

  const submissionMap = useMemo(() => {
    const map = new Map<string, AssistantSubmission[]>();
    const chapterIdsBySeries = new Map<string, Set<string>>();
    for (const [sid, chs] of chapterMap) {
      chapterIdsBySeries.set(sid, new Set(chs.map((c) => c.id)));
    }
    for (const s of allSubmissions) {
      if (!s.chapterId) continue;
      for (const [sid, cids] of chapterIdsBySeries) {
        if (cids.has(s.chapterId)) {
          const arr = map.get(sid) ?? [];
          arr.push(s);
          map.set(sid, arr);
        }
      }
    }
    return map;
  }, [allSubmissions, chapterMap]);

  const proposalsMap = useMemo(() => new Map(proposals.map((p) => [p.id, p])), [proposals]);

  const activeProductionSeries = useMemo(() => {
    return series.filter((s) => {
      if (!s.proposalId) return true;
      const p = proposalsMap.get(s.proposalId);
      if (!p) return true;
      return p.status === "APPROVED";
    });
  }, [series, proposalsMap]);

  const pendingProposals = useMemo(() => {
    return proposals.filter((p) => p.status !== "APPROVED");
  }, [proposals]);

  const kpis = useMemo(() => {
    const activeCount = activeProductionSeries.filter((s) => s.status !== "COMPLETED").length;

    let pendingReviewCount = 0;
    for (const ch of allChapters) {
      if (ch.status === "EDITOR_REVIEW") pendingReviewCount++;
    }
    for (const s of allSubmissions) {
      if (
        s.status === "PENDING" ||
        s.status === "MANGAKA_REVISION_REQUESTED" ||
        s.status === "EDITOR_REVISION_REQUESTED"
      )
        pendingReviewCount++;
    }

    const now = Date.now();
    let overdueCount = 0;
    for (const t of allTasks) {
      if (t.status === "EDITOR_APPROVED" || t.status === "REJECTED" || t.status === "CANCELLED")
        continue;
      if (t.dueAt && new Date(t.dueAt).getTime() < now) overdueCount++;
    }

    let nextDeadlineMs = Infinity;
    for (const ch of allChapters) {
      if (ch.status === "PUBLISHED" || ch.status === "SCHEDULED") continue;
      for (const d of [ch.draftDueAt, ch.reviewDueAt, ch.scheduledAt]) {
        if (d) {
          const ms = new Date(d).getTime();
          if (ms > now && ms < nextDeadlineMs) nextDeadlineMs = ms;
        }
      }
    }
    for (const t of allTasks) {
      if (t.status === "EDITOR_APPROVED" || t.status === "REJECTED" || t.status === "CANCELLED")
        continue;
      if (t.dueAt) {
        const ms = new Date(t.dueAt).getTime();
        if (ms > now && ms < nextDeadlineMs) nextDeadlineMs = ms;
      }
    }
    const nextDeadline =
      nextDeadlineMs < Infinity
        ? new Date(nextDeadlineMs).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : null;

    return { activeCount, pendingReviewCount, overdueCount, nextDeadline };
  }, [activeProductionSeries, allChapters, allTasks, allSubmissions]);

  const items = useMemo(() => {
    const now = Date.now();
    return activeProductionSeries
      .filter((s) => statusFilter === "ALL" || s.status === statusFilter)
      .filter((s) => !q.trim() || s.title.toLowerCase().includes(q.toLowerCase()))
      .filter((s) => {
        if (!workflowFilter) return true;
        const chs = chapterMap.get(s.id) ?? [];
        const tks = taskMap.get(s.id) ?? [];
        const subs = submissionMap.get(s.id) ?? [];
        switch (workflowFilter) {
          case "REVIEW_NEEDED":
            return (
              chs.some((c) => c.status === "EDITOR_REVIEW") ||
              subs.some(
                (s) =>
                  s.status === "PENDING" ||
                  s.status === "MANGAKA_REVISION_REQUESTED" ||
                  s.status === "EDITOR_REVISION_REQUESTED",
              )
            );
          case "OVERDUE":
            return tks.some(
              (t) =>
                t.status !== "EDITOR_APPROVED" &&
                t.status !== "REJECTED" &&
                t.status !== "CANCELLED" &&
                t.dueAt &&
                new Date(t.dueAt).getTime() < now,
            );
          case "BLOCKED":
            return tks.some(
              (t) =>
                t.blocked ||
                t.status === "MANGAKA_REVISION_REQUESTED" ||
                t.status === "EDITOR_REVISION_REQUESTED",
            );
          case "WAITING_EDITOR":
            return chs.some((c) => c.status === "EDITOR_REVIEW");
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [activeProductionSeries, statusFilter, workflowFilter, q, chapterMap, taskMap, submissionMap]);

  const filteredProposals = useMemo(() => {
    return pendingProposals
      .filter((p) => !q.trim() || p.title.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [pendingProposals, q]);

  const clearFilters = useCallback(() => {
    setStatusFilter("ALL");
    setWorkflowFilter(null);
    setQ("");
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Production"
          title="Series sản xuất"
          description="Tải dữ liệu series và proposal..."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Surface key={i} className="h-[72px] animate-pulse" />
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Surface key={i} className="h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMsg = mapApiError(error);
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Production"
          title="Series sản xuất"
          description="Quản lý các đề xuất và series đang sản xuất."
        />
        <StateBlock tone="danger" title="Không thể tải dữ liệu series" description={errorMsg} />
      </div>
    );
  }

  const isFiltered = statusFilter !== "ALL" || workflowFilter !== null || q.trim() !== "";
  const hasNoItemsAtAll = pendingProposals.length === 0 && activeProductionSeries.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Production"
        title="Series sản xuất"
        description="Quản lý các đề xuất series và các dự án series đang sản xuất."
      >
        <ActionButton tone="primary" onClick={() => navigate({ to: "/app/submissions/new" })}>
          <Plus className="size-4" />
          Tạo đề xuất series
        </ActionButton>
        <Link
          to="/app/submissions"
          className="inline-flex h-10 items-center rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] font-semibold text-[var(--admin-ink)] shadow-sm hover:bg-[var(--admin-hover)]"
        >
          Đề xuất chờ duyệt
        </Link>
        <TextButton onClick={() => refetch()}>
          <RefreshCw className="size-4" />
          Refresh
        </TextButton>
      </PageHeader>

      {/* KPI Section */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Layers className="size-4" />}
          tone="blue"
          label="Active series"
          value={kpis.activeCount}
        />
        <StatCard
          icon={<Eye className="size-4" />}
          tone={kpis.pendingReviewCount ? "amber" : "neutral"}
          label="Pending review"
          value={kpis.pendingReviewCount || "—"}
          hint={kpis.pendingReviewCount ? `${kpis.pendingReviewCount} items` : "Không có"}
        />
        <StatCard
          icon={<AlertTriangle className="size-4" />}
          tone={kpis.overdueCount ? "rose" : "neutral"}
          label="Overdue tasks"
          value={kpis.overdueCount || "—"}
          hint={kpis.overdueCount ? `${kpis.overdueCount} tasks` : "Không có"}
        />
        <StatCard
          icon={<CalendarClock className="size-4" />}
          tone="emerald"
          label="Next deadline"
          value={kpis.nextDeadline ?? "—"}
          hint={kpis.nextDeadline ? "Sắp tới" : "Không có deadline"}
        />
      </section>

      <SearchToolbar
        query={q}
        onQueryChange={setQ}
        placeholder="Tìm kiếm series hoặc đề xuất..."
        filters={
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUSES.map((status) => (
              <FilterChip
                key={status}
                active={statusFilter === status}
                onClick={() => setStatusFilter(status)}
              >
                {STATUS_LABEL[status]}
              </FilterChip>
            ))}
            <span className="mx-1 h-5 w-px bg-[var(--admin-border)]" />
            {WORKFLOW_FILTERS.map(({ key, label }) => (
              <FilterChip
                key={key}
                active={workflowFilter === key}
                onClick={() => setWorkflowFilter(workflowFilter === key ? null : key)}
              >
                {label}
              </FilterChip>
            ))}
          </div>
        }
        actions={
          isFiltered ? (
            <TextButton onClick={clearFilters} className="h-9 px-3">
              Xóa bộ lọc
            </TextButton>
          ) : null
        }
      />

      {hasNoItemsAtAll ? (
        <EmptyState
          title="Bạn chưa có đề xuất series nào."
          description="Hãy tạo đề xuất đầu tiên và tải manuscript/sample để gửi Editor duyệt."
          action={
            <ActionButton tone="primary" onClick={() => navigate({ to: "/app/submissions/new" })}>
              <Plus className="size-4" />
              Tạo đề xuất series
            </ActionButton>
          }
        />
      ) : (
        <div className="space-y-10">
          {/* Section 1: My Proposals */}
          <div className="space-y-4">
            <SectionHeading
              title="Đề xuất của tôi"
              icon={<FileText className="size-5" />}
              meta={`${filteredProposals.length} đề xuất`}
            />
            {filteredProposals.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                {isFiltered ? "Không tìm thấy đề xuất nào phù hợp." : "Chưa có đề xuất nào."}
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredProposals.map((p) => (
                  <ProposalCard key={p.id} proposal={p} />
                ))}
              </div>
            )}
          </div>

          {/* Section 2: My Production Series */}
          <div className="space-y-4">
            <SectionHeading
              title="Series đang sản xuất"
              icon={<Layers className="size-5" />}
              meta={`${items.length} series`}
            />
            {items.length === 0 ? (
              isFiltered ? (
                <EmptyState
                  title="Không có series nào khớp với bộ lọc hiện tại."
                  description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                  action={
                    <ActionButton tone="primary" onClick={clearFilters}>
                      Xóa bộ lọc
                    </ActionButton>
                  }
                />
              ) : pendingProposals.length > 0 ? (
                <StateBlock
                  title="Đề xuất đang chờ duyệt"
                  description="Series production workspace sẽ mở sau khi proposal được duyệt."
                />
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  Chưa có series đang sản xuất nào.
                </p>
              )
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((s) => (
                  <SeriesCardWrapper
                    key={s.id}
                    series={s}
                    allChapters={allChapters}
                    allTasks={allTasks}
                    allSubmissions={allSubmissions}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "h-8 rounded-[5px] border border-[var(--admin-navy)] bg-[var(--admin-navy)] px-3 text-[11px] font-semibold text-[var(--admin-cream)]"
          : "h-8 rounded-[5px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-[11px] font-semibold text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-ink)]"
      }
    >
      {children}
    </button>
  );
}
