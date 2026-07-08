import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge } from "@/entities/user";
import type { Role } from "@/shared/auth";
import { MetricCard, PageHeader, Panel, StateBlock, EmptyState } from "@/shared/ui";
import { AccessDenied } from "../../_shared";
import { PageShell, TableSkeleton } from "@/shared/layout/page-layout";
import { useAdminAccess, mapAdminError } from "../../_shared";
import { useAdminAuditQuery } from "../api/audit.queries";
import { FileClock } from "lucide-react";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminAuditPage() {
  const { canQueryAdmin, denial } = useAdminAccess();
  const {
    data: entries = [],
    isLoading,
    error,
  } = useAdminAuditQuery(undefined, {
    enabled: canQueryAdmin,
  });
  const overrides = entries.filter(
    (entry) => entry.action.includes("OVERRIDE") || entry.action.includes("PREVIEW"),
  ).length;

  if (denial) {
    return (
      <AccessDenied
        title="Audit logs"
        description="Backend audit stream for proposal, chapter, storage, user, payroll, and override-sensitive admin actions."
        denial={denial}
      />
    );
  }

  if (error) {
    return (
      <PageShell maxWidth="7xl">
        <PageHeader
          title="Audit logs"
          description="Backend audit stream for proposal, chapter, storage, user, payroll, and override-sensitive admin actions."
        />
        <StateBlock
          tone="danger"
          title="Could not load audit logs"
          description={mapAdminError(error)}
        />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        title="Audit logs"
        description="Backend audit stream for proposal, chapter, storage, user, payroll, and override-sensitive admin actions."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Entries"
          value={String(entries.length)}
          hint="Persisted in backend database"
        />
        <MetricCard
          label="Overrides"
          value={String(overrides)}
          hint="Require written reason"
          tone={overrides > 0 ? "warning" : "default"}
        />
        <MetricCard label="Retention" value="200" hint="Backend query limit" />
      </section>

      <Panel title="Event stream">
        {isLoading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : entries.length === 0 ? (
          <EmptyState
            title="No entries yet"
            description="Run workflow or admin actions to populate the audit stream."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Admin audit event stream">
              <caption className="sr-only">Audit log entries</caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">When</TableHead>
                  <TableHead scope="col">Actor</TableHead>
                  <TableHead scope="col">Entity</TableHead>
                  <TableHead scope="col">Action</TableHead>
                  <TableHead scope="col">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-[var(--admin-faint)]">
                      {formatDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold">{entry.actorId}</span>
                        <RoleBadge role={entry.actorRole.toLowerCase() as Role} />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[var(--admin-faint)]">
                      {entry.entityType}/{entry.entityId}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase">
                        <FileClock className="size-3.5 text-[var(--admin-faint)]" />
                        {entry.action}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md text-xs text-[var(--admin-faint)]">
                      {entry.metadata && Object.keys(entry.metadata).length > 0
                        ? JSON.stringify(entry.metadata)
                        : "No metadata"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
