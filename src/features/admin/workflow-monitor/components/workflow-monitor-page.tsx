import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeparationOfDutiesWarning } from "@/entities/access";
import { MetricCard, PageHeader, Panel, StateBlock, StatusPill } from "@/shared/ui";
import { useAdminAccess, AccessDenied, useAdminWorkflowSummaryQuery } from "../../_shared";
import { PageShell } from "@/shared/layout/page-layout";
import { AlertCircle, GitBranch, TimerReset } from "lucide-react";

export function AdminWorkflowMonitorPage() {
  const { canQueryAdmin, denial } = useAdminAccess();
  const {
    data: summary,
    isLoading,
    isError,
  } = useAdminWorkflowSummaryQuery({ enabled: canQueryAdmin });

  if (denial) {
    return (
      <AccessDenied
        title="Workflow Monitor"
        description="You do not have permission to access the workflow monitor page."
        denial={denial}
      />
    );
  }

  if (isLoading) {
    return (
      <PageShell maxWidth="7xl">
        <PageHeader
          title="Workflow monitor"
          description="Cross-role queue for stuck transitions, missing callbacks, and governance handoffs."
        />
        <section className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)]"
            />
          ))}
        </section>
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell maxWidth="7xl">
        <PageHeader
          title="Workflow monitor"
          description="Cross-role queue for stuck transitions, missing callbacks, and governance handoffs."
        />
        <StateBlock
          tone="danger"
          title="Could not load workflow data"
          description="The backend workflow summary is unavailable."
        />
      </PageShell>
    );
  }

  const issues = summary?.issues ?? [];
  const high = summary?.counts.highRisk ?? 0;

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        title="Workflow monitor"
        description="Cross-role queue for stuck transitions, missing callbacks, and governance handoffs."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Issues"
          value={isLoading ? "..." : String(summary?.counts.issues ?? issues.length)}
          hint="Open workflow signals"
        />
        <MetricCard
          label="High risk"
          value={String(high)}
          hint="Tie-break or blocked transition"
          tone={high > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Callbacks"
          value={isError ? "ERR" : "Live"}
          hint="Backend workflow summary"
          tone={isError ? "danger" : "success"}
        />
      </section>

      <SeparationOfDutiesWarning>
        Monitor actions are inspection-first. Admin can recover bad state, but normal approval still
        runs through proposal, chapter, and voting services.
      </SeparationOfDutiesWarning>

      <Panel title="Transition watchlist">
        <p className="mb-4 text-xs text-[var(--admin-faint)]">
          Read-only monitor. Admin can recover bad state, but normal approval runs through workflow
          services.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>
                  <p className="text-sm font-semibold">{issue.item}</p>
                  <p className="flex items-center gap-1 text-[11px] text-[var(--admin-faint)]">
                    <GitBranch className="size-3" />
                    {issue.id}
                  </p>
                </TableCell>
                <TableCell className="text-xs text-[var(--admin-faint)]">{issue.owner}</TableCell>
                <TableCell>
                  <StatusPill status={issue.stage.toLowerCase()} />
                </TableCell>
                <TableCell>
                  <StatusPill
                    status={
                      issue.severity === "HIGH"
                        ? "rejected"
                        : issue.severity === "MEDIUM"
                          ? "submitted"
                          : "ready"
                    }
                  />
                </TableCell>
                <TableCell className="text-xs text-[var(--admin-faint)]">
                  <span className="flex items-center gap-2">
                    {issue.severity === "HIGH" ? (
                      <AlertCircle className="size-3.5 text-rose-700" />
                    ) : (
                      <TimerReset className="size-3.5" />
                    )}
                    {issue.detail}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </PageShell>
  );
}
