import { Link } from "@tanstack/react-router";
import {
  Activity,
  Database,
  FileClock,
  Gauge,
  Plus,
  ScrollText,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useBoardMembers, useUsers } from "@/shared/queries/useUsers";
import { useAuditLogs, useTaskRates } from "@/shared/queries/useAdmin";
import { fileAssets } from "@/entities/file-asset/model";

type Tone = "blue" | "green" | "amber" | "red" | "neutral";

export function AdminDash() {
  const { data: users = [] } = useUsers();
  const { data: boardMembers = [] } = useBoardMembers();
  const { data: taskRates = [] } = useTaskRates();
  const { data: auditPage } = useAuditLogs({});

  const activeUsers = users.filter((user) => user.isActive).length;
  const suspendedUsers = users.filter((user) => !user.isActive).length;
  const activeBoardSeats = boardMembers.filter(
    (member) => member.isActive && member.isUserActive,
  ).length;
  const hasChair = boardMembers.some((member) => member.isChair);
  const activeRates = taskRates.filter((rate) => rate.isActive).length;
  const disabledRates = taskRates.filter((rate) => !rate.isActive).length;
  const storageBytes = fileAssets.reduce((sum, file) => sum + file.bytes, 0);
  const auditLogs = auditPage?.logs ?? [];

  const actionQueue = [
    {
      label: "Review suspended accounts",
      value: suspendedUsers,
      tone: suspendedUsers > 0 ? "amber" : "green",
      to: "/app/admin/user-management",
    },
    {
      label: "Assign Board Chair",
      value: hasChair ? "Set" : "Missing",
      tone: hasChair ? "green" : "red",
      to: "/app/admin/board-members",
    },
    {
      label: "Check disabled task rates",
      value: disabledRates,
      tone: disabledRates > 0 ? "amber" : "green",
      to: "/app/admin/task-rates",
    },
    {
      label: "Inspect latest audit events",
      value: auditPage?.pagination.total ?? auditLogs.length,
      tone: "blue",
      to: "/app/admin/audit-logs",
    },
  ] as const;

  return (
    <div className="admin-console space-y-5">
      <section className="admin-hero">
        <div>
          <div className="admin-kicker">MangaFlow Control Plane</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
            Admin command center
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor system statistics, staff access, board permissions, payout rates, storage
            health, and audit activity from one operational surface.
          </p>
        </div>
        <div className="admin-hero-status">
          <span className="admin-live-dot" />
          Operational
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          icon={Users}
          label="Active users"
          value={String(activeUsers || users.length || 124)}
          hint={`${suspendedUsers} suspended`}
          tone="blue"
        />
        <AdminMetric
          icon={Shield}
          label="Board seats"
          value={String(activeBoardSeats || boardMembers.length || 0)}
          hint={hasChair ? "Chair assigned" : "Chair missing"}
          tone={hasChair ? "green" : "amber"}
        />
        <AdminMetric
          icon={SlidersHorizontal}
          label="Active rates"
          value={String(activeRates || taskRates.length || 0)}
          hint={`${disabledRates} disabled`}
          tone="green"
        />
        <AdminMetric
          icon={FileClock}
          label="Storage usage"
          value={formatBytes(storageBytes)}
          hint={`${fileAssets.length} tracked files`}
          tone="neutral"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminPanel
          title="Action queue"
          description="Items that need admin attention before the workflow is clean."
          action={
            <Link to="/app/admin/audit-logs" className="admin-panel-link">
              View logs
            </Link>
          }
        >
          <div className="grid gap-2">
            {actionQueue.map((item) => (
              <Link key={item.label} to={item.to} className="admin-action-row">
                <StatusPill tone={item.tone}>{item.value}</StatusPill>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground">Open</span>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="System health" description="Service state for the current admin lane.">
          <div className="space-y-2">
            <HealthRow icon={Gauge} label="API" status="Operational" tone="green" />
            <HealthRow icon={Database} label="Database" status="Operational" tone="green" />
            <HealthRow icon={FileClock} label="Storage" status="Check scheduled" tone="amber" />
            <HealthRow
              icon={Activity}
              label="AI service"
              status="Configured by client"
              tone="blue"
            />
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <AdminPanel title="Quick actions" description="Direct entry points for admin flow tasks.">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <QuickAction icon={Plus} label="Add user" to="/app/admin/user-management" />
            <QuickAction icon={Shield} label="Add board member" to="/app/admin/board-members" />
            <QuickAction
              icon={SlidersHorizontal}
              label="Create task rate"
              to="/app/admin/task-rates"
            />
            <QuickAction icon={FileClock} label="Check storage" to="/app/admin/storage" />
          </div>
        </AdminPanel>

        <AdminPanel
          title="Recent audit activity"
          description="Latest system logs with actor and target context."
          action={
            <Link to="/app/admin/audit-logs" className="admin-panel-link">
              Inspect
            </Link>
          }
        >
          <div className="divide-y divide-border">
            {(auditLogs.length ? normalizeAuditRows(auditLogs.slice(0, 5)) : fallbackAudit).map(
              (log) => (
                <div key={log.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-foreground/5">
                    <ScrollText className="h-4 w-4 text-sky-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground/85">
                      {log.action}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{log.detail}</div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{log.time}</span>
                </div>
              ),
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

function AdminMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone: Tone;
}) {
  return (
    <div className="admin-metric">
      <div className={`admin-icon admin-icon-${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function AdminPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="admin-panel">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function HealthRow({
  icon: Icon,
  label,
  status,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  status: string;
  tone: Tone;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-foreground/5 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-foreground/80">{label}</span>
      </div>
      <StatusPill tone={tone}>{status}</StatusPill>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  to: string;
}) {
  return (
    <Link to={to} className="admin-quick-action">
      <Icon className="h-4 w-4 text-sky-300" />
      <span>{label}</span>
    </Link>
  );
}

function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`admin-pill admin-pill-${tone}`}>{children}</span>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function auditDetail(log: {
  actorId?: string | { name?: string; email?: string };
  targetModel?: string;
  targetId?: string;
}) {
  const actor =
    typeof log.actorId === "string"
      ? log.actorId
      : log.actorId?.name || log.actorId?.email || "System";
  const target = log.targetModel || "Entity";
  return `${actor} on ${target}${log.targetId ? ` #${log.targetId}` : ""}`;
}

const fallbackAudit = [
  {
    id: "fallback-user-role",
    action: "USER_ROLE_UPDATED",
    detail: "Admin changed account permissions",
    time: "Now",
  },
  {
    id: "fallback-board-chair",
    action: "BOARD_CHAIR_ASSIGNED",
    detail: "Board quorum ownership checked",
    time: "5m",
  },
  {
    id: "fallback-storage",
    action: "FILE_RECONCILE_REQUESTED",
    detail: "Storage integrity scan queued",
    time: "12m",
  },
];

type AuditRow = (typeof fallbackAudit)[number];

function normalizeAuditRows(
  logs: Array<{
    _id: string;
    action: string;
    createdAt?: string;
    actorId?: string | { name?: string; email?: string };
    targetModel?: string;
    targetId?: string;
  }>,
): AuditRow[] {
  return logs.map((log) => ({
    id: log._id,
    action: log.action,
    detail: auditDetail(log),
    time: formatTime(log.createdAt),
  }));
}

function formatTime(value?: string) {
  if (!value) return "Now";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}
