import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge } from "@/entities/user";
import { MetricCard, PageHeader, Panel, StateBlock } from "@/shared/ui";
import {
  useChaptersForSeriesQuery,
  useMySeriesQuery,
  useRankingsListQuery,
} from "@/entities/series";
import { StatusPill } from "@/shared/ui/status-pill";
import { useAdminAccess, AccessDenied } from "../../_shared";
import { PageShell } from "@/shared/layout/page-layout";
import { BookOpen, Users } from "lucide-react";

export function AdminSeriesManagementPage() {
  const { denial } = useAdminAccess();
  const { data: series = [], isLoading: seriesLoading } = useMySeriesQuery();
  const seriesIds = series.map((item) => item.id);
  const { data: chapters = [], isLoading: chaptersLoading } = useChaptersForSeriesQuery(seriesIds);
  const { data: rankings = [], isLoading: rankingsLoading } = useRankingsListQuery();
  const isLoading = seriesLoading || chaptersLoading || rankingsLoading;

  if (denial) {
    return (
      <AccessDenied
        title="Series Management"
        description="You do not have permission to access the series management page."
        denial={denial}
      />
    );
  }

  if (isLoading) {
    return (
      <PageShell maxWidth="7xl">
        <PageHeader
          title="Series management"
          description="Operational inventory across production series, editors, assistants, chapter status, and board risk signals."
        />
        <section className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)]"
            />
          ))}
        </section>
      </PageShell>
    );
  }

  if (series.length === 0) {
    return (
      <PageShell maxWidth="7xl">
        <PageHeader
          title="Series management"
          description="Operational inventory across production series, editors, assistants, chapter status, and board risk signals."
        />
        <StateBlock
          tone="default"
          title="No series found"
          description="There are no series in production yet."
        />
      </PageShell>
    );
  }

  const ongoing = series.filter((item) => item.status === "ONGOING").length;
  const hiatus = series.filter((item) => item.status === "HIATUS").length;

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        title="Series management"
        description="Operational inventory across production series, editors, assistants, chapter status, and board risk signals."
      />

      <section className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Series" value={String(series.length)} hint="Tracked in production" />
        <MetricCard
          label="Ongoing"
          value={String(ongoing)}
          hint="Currently publishing"
          tone="success"
        />
        <MetricCard
          label="Hiatus"
          value={String(hiatus)}
          hint="Paused or board-held"
          tone={hiatus > 0 ? "warning" : "default"}
        />
        <MetricCard label="Chapters" value={String(chapters.length)} hint="Across all series" />
      </section>

      <Panel
        title="Series register"
        description="Admin can inspect and recover, but creative progression still belongs to the workflow owner."
      >
        <p className="mb-4 text-xs text-[var(--admin-faint)]">
          Read-only monitor. Series mutations belong to workflow owners.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Series</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Editor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Production</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="text-right">Governance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {series.map((item) => {
              const itemChapters = chapters.filter((chapter) => chapter.seriesId === item.id);
              const risk = rankings.find(
                (ranking) =>
                  (ranking.seriesId === item.id || ranking.seriesTitle === item.title) &&
                  (ranking.atRisk || ranking.status === "AT_RISK"),
              );
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="flex items-center gap-1 text-[11px] text-[var(--admin-faint)]">
                      <BookOpen className="size-3" />
                      {item.cadence} - target {item.targetChapters}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--admin-faint)]">
                    {item.authorName}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="text-xs">{item.editorName}</span>
                      <RoleBadge role="editor" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={item.status.toLowerCase()} />
                  </TableCell>
                  <TableCell className="text-xs text-[var(--admin-faint)]">
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {item.assistantIds.length} assistants, {itemChapters.length} chapters
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={risk ? "at_risk" : "ready"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs font-medium text-[var(--admin-faint)]">
                      Board decision required
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Panel>
    </PageShell>
  );
}
