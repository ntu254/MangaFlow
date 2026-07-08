import { Activity, AlertTriangle, Database, ShieldCheck, Users } from "lucide-react";
import { SeparationOfDutiesWarning } from "@/entities/access";
import { RoleBadge } from "@/entities/user";
import { StatusPill } from "@/shared/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/shared/auth";
import {
  useChaptersForSeriesQuery,
  useMySeriesQuery,
  useRankingsListQuery,
} from "@/entities/series";
import { useProposalsQuery } from "@/features/proposals";
import { useAdminAuditQuery } from "../../audit/api/audit.queries";
import { useAdminUsersQuery } from "../../users/api/users.queries";
import { MetricCard, PageHeader, Panel, StateBlock } from "@/shared/ui";
import { AccessDenied, useAdminAccess } from "../../_shared";
import { PageShell } from "@/shared/layout/page-layout";

export function AdminDashboard() {
  const { denial } = useAdminAccess();
  const user = useAuth((state) => state.user);
  const { data: proposals = [], isLoading: proposalsLoading } = useProposalsQuery();
  const { data: series = [], isLoading: seriesLoading } = useMySeriesQuery();
  const seriesIds = series.map((item) => item.id);
  const { data: chapters = [], isLoading: chaptersLoading } = useChaptersForSeriesQuery(seriesIds);
  const { data: auditEntries = [] } = useAdminAuditQuery();
  const { data: rankings = [], isLoading: rankingsLoading } = useRankingsListQuery();
  const { data: users = [], isLoading: usersLoading } = useAdminUsersQuery();
  const boardPending = proposals.filter((proposal) => proposal.status === "PENDING_BOARD").length;
  const workflowIssues = chapters.filter((chapter) =>
    ["REVISION", "IN_REVIEW"].includes(chapter.status),
  ).length;
  const openRisk = rankings.filter(
    (ranking) => ranking.atRisk || ranking.status === "AT_RISK",
  ).length;
  const isLoading =
    proposalsLoading || seriesLoading || chaptersLoading || rankingsLoading || usersLoading;

  if (denial) {
    return (
      <AccessDenied
        title="Operations control"
        description="System health, governance backlog, and override-sensitive operations for the MangaFlow workspace."
        denial={denial}
      />
    );
  }

  if (isLoading) {
    return (
      <PageShell maxWidth="7xl">
        <PageHeader
          title="Operations control"
          description="System health, governance backlog, and override-sensitive operations for the MangaFlow workspace."
        />
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)]"
            />
          ))}
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        title="Operations control"
        description="System health, governance backlog, and override-sensitive operations for the MangaFlow workspace."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Users"
          value={usersLoading ? "..." : String(users.length)}
          hint="Seeded accounts and board members"
        />
        <MetricCard
          label="Series"
          value={String(series.length)}
          hint="Production source of truth"
        />
        <MetricCard
          label="Board queue"
          value={String(boardPending)}
          hint="Awaiting governance vote"
          tone="warning"
        />
        <MetricCard
          label="Workflow issues"
          value={String(workflowIssues)}
          hint="Review or revision states"
        />
        <MetricCard
          label="At-risk"
          value={String(openRisk)}
          hint="Open governance review"
          tone={openRisk > 0 ? "danger" : "success"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Live governance surface"
          description="Read-only operational scan before the backend owns every mutation."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Signal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.slice(0, 4).map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell>
                    <p className="text-sm font-semibold">{proposal.title}</p>
                    <p className="text-[11px] text-[var(--admin-faint)]">{proposal.id}</p>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--admin-faint)]">
                    {proposal.assignedEditorName ?? proposal.authorName}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={proposal.status.toLowerCase()} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-[var(--admin-faint)]">
                    {proposal.votes.length}/5 votes
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <SeparationOfDutiesWarning>
          Admin override is for operational recovery only. Normal creative approval remains owned by
          editor, mangaka, and board workflows.
        </SeparationOfDutiesWarning>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="System checks">
          <ul className="space-y-3 text-xs">
            {[
              { icon: ShieldCheck, label: "JWT refresh guard", value: "configured" },
              { icon: Database, label: "Mongo source of truth", value: "seeded local" },
              { icon: Activity, label: "AI bridge", value: "Express gateway only" },
              {
                icon: AlertTriangle,
                label: "Ranking period",
                value: rankings[0]?.status ?? "DRAFT",
              },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)]/60 pb-2 last:border-0 last:pb-0"
              >
                <span className="flex items-center gap-2">
                  <item.icon className="size-3.5 text-[var(--admin-faint)]" />
                  {item.label}
                </span>
                <span className="font-mono text-[11px] uppercase text-[var(--admin-faint)]">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Role distribution">
          <div className="space-y-2">
            {(["admin", "mangaka", "assistant", "editor", "board"] as const).map((role) => (
              <div
                key={role}
                className="flex items-center justify-between rounded border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2"
              >
                <RoleBadge role={role} />
                <span className="text-xs font-semibold">
                  {users.filter((item) => item.role.toLowerCase() === role).length}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Latest audit entries">
          {auditEntries.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center rounded border border-dashed border-[var(--admin-border)] text-center">
              <Users className="size-5 text-[var(--admin-faint)]" />
              <p className="mt-2 text-xs text-[var(--admin-faint)]">No local audit entries yet.</p>
            </div>
          ) : (
            <ul className="space-y-3 text-xs">
              {auditEntries.slice(0, 4).map((entry) => (
                <li
                  key={entry.id}
                  className="border-b border-[var(--admin-border)]/60 pb-2 last:border-0 last:pb-0"
                >
                  <p className="font-semibold">{entry.action}</p>
                  <p className="text-[var(--admin-faint)]">
                    {entry.actorId} - {entry.entityType}/{entry.entityId}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </PageShell>
  );
}
