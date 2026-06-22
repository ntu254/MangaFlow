import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { EmptyState, PageHeader, StatCard } from "@/layouts/AppShell";
import { useAuditLogs } from "@/shared/queries/useAdmin";
import type { AuditLogItem } from "@/shared/api/admin";
import { useRole } from "@/shared/lib/role";

export const Route = createFileRoute("/app/admin/audit-logs")({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { user } = useRole();
  const canAccessAdmin = user?.role === "ADMIN";
  const [filters, setFilters] = useState({ action: "", actorId: "", targetId: "" });
  const [page, setPage] = useState(1);
  const queryFilters = {
    action: filters.action.trim() || undefined,
    actorId: filters.actorId.trim() || undefined,
    targetId: filters.targetId.trim() || undefined,
    page,
    limit: 20,
  };
  const { data, isLoading, error } = useAuditLogs(queryFilters, { enabled: canAccessAdmin });
  const logs = data?.logs ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  if (!canAccessAdmin) {
    return (
      <div className="admin-console admin-page space-y-5">
        <PageHeader title="Audit Logs" jp="System trace" />
        <EmptyState
          title="Admin permission required"
          hint="Sign in as Admin to view raw audit logs."
        />
      </div>
    );
  }

  function updateFilter(name: keyof typeof filters, value: string) {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  }

  return (
    <div className="admin-console admin-page space-y-5">
      <PageHeader
        title="Audit Logs"
        jp="System trace"
        description="View system logs, filter events, and inspect user actions."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Loaded logs" value={String(logs.length)} />
        <StatCard label="Total matches" value={String(data?.pagination.total ?? 0)} />
        <StatCard label="Page" value={String(data?.pagination.page ?? 1)} />
      </div>

      <div className="grid gap-3 rounded-md border border-foreground/10 bg-card p-4 md:grid-cols-3">
        <FilterInput
          label="Filter logs by action"
          value={filters.action}
          onChange={(action) => updateFilter("action", action)}
          placeholder="USER_ROLE_UPDATED"
        />
        <FilterInput
          label="Actor ID"
          value={filters.actorId}
          onChange={(actorId) => updateFilter("actorId", actorId)}
          placeholder="User id"
        />
        <FilterInput
          label="Target ID"
          value={filters.targetId}
          onChange={(targetId) => updateFilter("targetId", targetId)}
          placeholder="Entity id"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        <div className="grid grid-cols-[1fr_1fr_1fr_1.6fr_0.9fr] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
          <span>Action</span>
          <span>Actor</span>
          <span>Target</span>
          <span>Metadata</span>
          <span>Time</span>
        </div>
        {error ? (
          <div className="px-4 py-8 text-sm text-destructive">{auditErrorMessage(error)}</div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-foreground/50">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-foreground/50">
            No audit logs matched these filters.
          </div>
        ) : (
          logs.map((log) => <AuditLogRow key={log._id} log={log} />)
        )}
      </div>

      <div className="flex items-center justify-end gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1 || isLoading}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-foreground/15 px-3 text-foreground/70 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="px-2 text-xs text-foreground/50">
          Page {data?.pagination.page ?? page} of {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => current + 1)}
          disabled={page >= totalPages || isLoading}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-foreground/15 px-3 text-foreground/70 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AuditLogRow({ log }: { log: AuditLogItem }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_1.6fr_0.9fr] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0">
      <span className="font-mono text-xs">{log.action}</span>
      <span className="truncate text-foreground/70">{actorLabel(log.actorId)}</span>
      <span className="truncate text-foreground/70">
        {log.targetModel || "Entity"} {log.targetId ? `#${log.targetId}` : ""}
      </span>
      <code className="truncate rounded bg-foreground/5 px-2 py-1 text-[11px] text-foreground/60">
        {log.metadata ? JSON.stringify(log.metadata) : "{}"}
      </code>
      <span className="text-xs text-foreground/50">{formatDate(log.createdAt)}</span>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-foreground/60">{label}</span>
      <div className="flex h-9 items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-3">
        <Search className="h-3.5 w-3.5 text-foreground/40" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/35"
        />
      </div>
    </label>
  );
}

function actorLabel(actor: AuditLogItem["actorId"]) {
  if (!actor) return "System";
  if (typeof actor === "string") return actor;
  return actor.name || actor.email || actor.id || actor._id || "User";
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function auditErrorMessage(error: unknown) {
  const status =
    typeof error === "object" && error && "response" in error
      ? (error as { response?: { status?: number; data?: { message?: string } } }).response?.status
      : undefined;

  if (status === 403) return "Admin permission required";
  if (status === 404) return "Audit log endpoint not found";
  if (typeof error === "object" && error && "response" in error) {
    return (
      (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
      "Failed to load audit logs"
    );
  }
  return error instanceof Error ? error.message : "Failed to load audit logs";
}
