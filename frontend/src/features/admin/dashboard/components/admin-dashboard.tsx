import { useMemo } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  Crown,
  RefreshCw,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/shared/lib/cn";
import { PageShell } from "@/shared/layout/page-layout";
import { AvatarInitials } from "@/shared/ui/avatar-initials";
import { StateBlock } from "@/shared/ui/state-block";
import { StatusPill } from "@/shared/ui/status-pill";
import { useAdminRateTableQuery } from "../../rate-table/api/rate-table.queries";
import { useAdminUsersQuery } from "../../users/api/users.queries";
import { useAdminNotificationsQuery } from "../../notifications/api/notifications.queries";
import {
  AccessDenied,
  mapAdminError,
  useAdminAccess,
  useDemoDataMutation,
  type AdminUser,
} from "../../_shared";

const ROLE_META: Array<{ key: string; label: string; color: string }> = [
  { key: "ADMIN", label: "Admin", color: "var(--role-admin)" },
  { key: "EDITOR", label: "Editor", color: "var(--role-editor)" },
  { key: "BOARD", label: "Board", color: "var(--role-board)" },
  { key: "MANGAKA", label: "Mangaka", color: "var(--role-mangaka)" },
  { key: "ASSISTANT", label: "Assistant", color: "var(--role-assistant)" },
];

const roleLabel = (role: string) =>
  ROLE_META.find((meta) => meta.key === role.toUpperCase())?.label ?? role;

const changedAt = (user?: AdminUser) => user?.updatedAt ?? user?.createdAt;

function formatRelative(value?: string) {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(then);
}

const canUseDemoTools = !import.meta.env.PROD;

export function AdminDashboard() {
  const { canQueryAdmin, denial } = useAdminAccess();
  const {
    data: users = [],
    isLoading: usersLoading,
    isFetching: usersFetching,
    error: usersError,
    refetch: refetchUsers,
  } = useAdminUsersQuery({ enabled: canQueryAdmin });
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useAdminNotificationsQuery({ enabled: canQueryAdmin });
  const {
    data: rates = [],
    isLoading: ratesLoading,
    error: ratesError,
    refetch: refetchRates,
  } = useAdminRateTableQuery({ enabled: canQueryAdmin });
  const demo = useDemoDataMutation();

  const totalAccounts = users.length;
  const activeUsers = users.filter((user) => user.active).length;
  const inactiveUsers = totalAccounts - activeUsers;
  const activeRateCount = rates.filter((rate) => rate.status === "ACTIVE").length;

  const roleCounts = useMemo(
    () =>
      ROLE_META.map((meta) => ({
        ...meta,
        count: users.filter((user) => user.role?.toUpperCase() === meta.key).length,
      })),
    [users],
  );
  const maxRoleCount = Math.max(1, ...roleCounts.map((role) => role.count));

  const chair = users.find((user) => user.isChair && user.active);
  const eic = users.find((user) => user.isEditorInChief && user.active);
  const designationsAssigned = (chair ? 1 : 0) + (eic ? 1 : 0);

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort(
          (a, b) =>
            new Date(changedAt(b) ?? 0).getTime() - new Date(changedAt(a) ?? 0).getTime(),
        )
        .slice(0, 6),
    [users],
  );

  const broadcasts = useMemo(() => {
    const seenBatch = new Set<string>();
    return notifications
      .filter((item) => item.audienceType === "ROLE" || item.audienceType === "ALL")
      .filter((item) => {
        if (!item.batchId) return true;
        if (seenBatch.has(item.batchId)) return false;
        seenBatch.add(item.batchId);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.sentAt ?? b.createdAt).getTime() -
          new Date(a.sentAt ?? a.createdAt).getTime(),
      )
      .slice(0, 3);
  }, [notifications]);

  const isLoading = usersLoading || notificationsLoading || ratesLoading;
  const isRefreshing = usersFetching;
  const error = usersError ?? notificationsError ?? ratesError;

  const refresh = () => {
    void Promise.all([refetchUsers(), refetchNotifications(), refetchRates()]);
  };

  const runDemo = (mode: "reset" | "clear") => {
    const message =
      mode === "reset"
        ? "Reseed the workspace to the demo baseline? This replaces all transactional data."
        : "Clear all transactional data? User accounts are kept.";
    if (window.confirm(message)) demo.mutate(mode);
  };

  if (denial) {
    return (
      <AccessDenied
        title="Admin dashboard"
        description="Account operations, access designations, and workspace policy for the MangaFlow Studio workspace."
        denial={denial}
      />
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <PageShell maxWidth="7xl" dashboardRole="admin" className="space-y-6 px-5 py-6 lg:px-8">
        <DashboardPageHeader
          eyebrow="Admin / Account & system"
          title="Administration"
          description="People, access, and policy for the MangaFlow workspace."
        />
        <StateBlock
          tone="danger"
          title="Admin data could not be loaded"
          description={mapAdminError(error)}
          action={
            <Button variant="outline" size="sm" onClick={refresh}>
              Try again
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="7xl" dashboardRole="admin" className="space-y-6 px-5 py-6 lg:px-8">
      <DashboardPageHeader
        eyebrow="Admin / Account & system"
        title="Administration"
        description="People, access, and policy for the MangaFlow workspace."
        actions={
          <Button
            variant="outline"
            onClick={refresh}
            disabled={isRefreshing}
            className="gap-2 border-[var(--admin-border)] bg-[var(--admin-surface)]"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing" : "Refresh data"}
          </Button>
        }
      />

      <section
        className="grid overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Account key performance indicators"
      >
        <MetricStripItem
          label="Total accounts"
          value={totalAccounts}
          hint="Users across all roles"
          icon={<Users className="size-4" />}
          tone="default"
        />
        <MetricStripItem
          label="Active users"
          value={activeUsers}
          hint={`${inactiveUsers} inactive`}
          icon={<UserCheck className="size-4" />}
          tone={activeUsers > 0 ? "success" : "warning"}
        />
        <MetricStripItem
          label="Designations"
          value={designationsAssigned}
          valueSuffix=" / 2"
          hint="Board Chair & Editor-in-Chief"
          icon={<ShieldCheck className="size-4" />}
          tone={designationsAssigned === 2 ? "success" : "warning"}
        />
        <MetricStripItem
          label="Active rate versions"
          value={activeRateCount}
          hint="Available for new paid tasks"
          icon={<Coins className="size-4" />}
          tone={activeRateCount > 0 ? "success" : "danger"}
        />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--admin-border)] py-3">
        <div className="flex items-center gap-2 text-[12px] text-[var(--admin-muted)]">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--role-editor)]/50" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[var(--role-editor)]" />
          </span>
          Account &amp; access overview
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--admin-faint)]">
          <Activity className="size-3.5" />
          Last account change {formatRelative(changedAt(recentUsers[0]))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <DashboardPanel
          title="Role distribution"
          description="Active and inactive accounts by workspace role."
          action={
            <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--admin-faint)]">
              {totalAccounts} accounts
            </span>
          }
          contentClassName="space-y-3 p-5"
        >
          {roleCounts.map((role) => (
            <div key={role.key} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[12px] font-semibold text-[var(--admin-muted)]">
                {role.label}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(role.count > 0 ? 6 : 0, (role.count / maxRoleCount) * 100)}%`,
                    backgroundColor: role.color,
                  }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums text-[var(--admin-ink)]">
                {role.count}
              </span>
            </div>
          ))}
        </DashboardPanel>

        <DashboardPanel
          title="Key designations"
          description="Single-holder governance roles Admin assigns."
          contentClassName="p-0"
        >
          <DesignationRow
            title="Board Chair"
            icon={<Crown className="size-4" />}
            holder={chair}
          />
          <DesignationRow
            title="Editor-in-Chief"
            icon={<Scale className="size-4" />}
            holder={eic}
          />
          <div className="px-5 py-3">
            <Link
              to="/app/admin/users"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--role-admin)] hover:underline"
            >
              Manage designations
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <DashboardPanel
          title="Recent account activity"
          description="The most recently created or updated accounts."
          action={
            <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--admin-faint)]">
              {recentUsers.length} shown
            </span>
          }
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--admin-border)] hover:bg-transparent">
                  <TableHead className="pl-5">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Changed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id} className="border-[var(--admin-border)]">
                    <TableCell className="max-w-[300px] pl-5">
                      <p className="truncate text-[13px] font-semibold text-[var(--admin-ink)]">
                        {user.name}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[var(--admin-faint)]">
                        {user.email}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[12px] text-[var(--admin-muted)]">
                      {roleLabel(user.role)}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={user.active ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-5 text-right text-[11px] text-[var(--admin-faint)]">
                      {formatRelative(changedAt(user))}
                    </TableCell>
                  </TableRow>
                ))}
                {recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <Users className="mx-auto size-5 text-[var(--admin-faint)]" />
                      <p className="mt-3 text-[13px] font-semibold text-[var(--admin-ink)]">
                        No accounts yet
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--admin-faint)]">
                        Create the first user from the Users page.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </DashboardPanel>

        <div className="grid gap-5">
          <DashboardPanel
            title="Broadcasts"
            description="Recent operational updates sent to the workspace."
            contentClassName="p-0"
          >
            {broadcasts.map((item) => (
              <div
                key={item.id}
                className="border-b border-[var(--admin-border)] px-5 py-3 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[13px] font-semibold text-[var(--admin-ink)]">
                    {item.title}
                  </p>
                  <span className="shrink-0 rounded bg-[var(--admin-hover)] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[var(--admin-muted)]">
                    {item.audienceType === "ALL"
                      ? "All"
                      : (item.audienceRole ?? "Role")}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--admin-faint)]">
                  {item.createdByName ? `${item.createdByName} · ` : ""}
                  {formatRelative(item.sentAt ?? item.createdAt)}
                </p>
              </div>
            ))}
            {broadcasts.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12px] text-[var(--admin-faint)]">
                No broadcasts sent yet.
              </p>
            ) : null}
            <div className="px-5 py-3">
              <Link
                to="/app/admin/notifications"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--role-admin)] hover:underline"
              >
                <Send className="size-3.5" />
                Send broadcast
              </Link>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Rate policy"
            description="Compensation versions for new paid tasks."
            contentClassName="space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-[var(--admin-muted)]">Policy readiness</span>
              <span className="flex items-center gap-2">
                <StatusPill status={activeRateCount > 0 ? "ready" : "at_risk"} />
                <span className="font-mono text-[11px] text-[var(--admin-faint)]">
                  {activeRateCount} active
                </span>
              </span>
            </div>
            <Link
              to="/app/admin/rates"
              className="inline-flex items-center gap-1.5 border-t border-[var(--admin-border)] pt-3 text-[12px] font-semibold text-[var(--role-admin)] hover:underline"
            >
              Review rate table
              <ArrowUpRight className="size-3.5" />
            </Link>
          </DashboardPanel>
        </div>
      </section>

      <section
        className={cn(
          "grid gap-5",
          canUseDemoTools && "xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]",
        )}
      >
        <DashboardPanel
          title="Workspace status"
          description="Key access and policy facts at a glance."
          contentClassName="p-0"
        >
          <StatusRow label="Active rate policy">
            <StatusPill status={activeRateCount > 0 ? "ready" : "at_risk"} />
          </StatusRow>
          <StatusRow label="Board Chair">
            <DesignationStatus holder={chair} />
          </StatusRow>
          <StatusRow label="Editor-in-Chief">
            <DesignationStatus holder={eic} />
          </StatusRow>
          <StatusRow label="Last account change">
            <span className="font-mono text-[12px] text-[var(--admin-muted)]">
              {formatRelative(changedAt(recentUsers[0]))}
            </span>
          </StatusRow>
        </DashboardPanel>

        {canUseDemoTools ? (
          <DashboardPanel
            title="Workspace tools"
            description="Demo data operations. Available outside production only."
            contentClassName="space-y-3"
          >
            <ToolRow
              icon={<RotateCcw className="size-4" />}
              label="Reset demo data"
              description="Reseed the workspace to the demo baseline."
              onClick={() => runDemo("reset")}
              disabled={demo.isPending}
            />
            <ToolRow
              icon={<Trash2 className="size-4" />}
              label="Clear demo data"
              description="Remove all transactional data, keep user accounts."
              onClick={() => runDemo("clear")}
              disabled={demo.isPending}
            />
            {demo.isError ? (
              <p className="text-[11px] text-destructive">
                {mapAdminError(demo.error)}
              </p>
            ) : null}
          </DashboardPanel>
        ) : null}
      </section>

      <section>
        <DashboardPanel
          title="Admin actions"
          description="Tasks this role can own from the control plane."
          contentClassName="grid gap-2 sm:grid-cols-3"
        >
          <QuickAction
            to="/app/admin/users"
            label="Manage users"
            description="Roles, access, and account status"
          />
          <QuickAction
            to="/app/admin/notifications"
            label="Send broadcast"
            description="Reach users with an operational update"
          />
          <QuickAction
            to="/app/admin/rates"
            label="Review rate table"
            description="Compensation policy and active versions"
          />
        </DashboardPanel>
      </section>
    </PageShell>
  );
}

function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--admin-border)] pb-6">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--admin-ink)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--admin-muted)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}

function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
        <div>
          <h2 className="font-sans text-[15px] font-semibold leading-tight text-[var(--admin-ink)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[12px] text-[var(--admin-faint)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className={cn("flex-1 p-4", contentClassName)}>{children}</div>
    </section>
  );
}

function MetricStripItem({
  label,
  value,
  valueSuffix,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: number;
  valueSuffix?: string;
  hint: string;
  icon: React.ReactNode;
  tone: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className="border-b border-[var(--admin-border)] p-4 last:border-b-0 sm:nth-[3]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
          {label}
        </span>
        <span
          className={cn(
            "grid size-7 place-items-center rounded-full",
            tone === "danger" && "bg-[var(--role-admin)]/10 text-[var(--role-admin)]",
            tone === "warning" && "bg-[var(--role-board)]/10 text-[var(--role-board)]",
            tone === "success" && "bg-[var(--role-editor)]/10 text-[var(--role-editor)]",
            tone === "default" && "bg-[var(--admin-hover)] text-[var(--admin-muted)]",
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-[-0.06em] text-[var(--admin-ink)]">
        {value.toLocaleString()}
        {valueSuffix ? (
          <span className="text-[var(--admin-faint)]">{valueSuffix}</span>
        ) : null}
      </p>
      <p className="mt-1 text-[11px] text-[var(--admin-faint)]">{hint}</p>
    </div>
  );
}

function DesignationRow({
  title,
  icon,
  holder,
}: {
  title: string;
  icon: React.ReactNode;
  holder?: AdminUser;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--admin-border)] px-5 py-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--admin-hover)] text-[var(--admin-muted)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
          {title}
        </p>
        {holder ? (
          <div className="mt-1 flex items-center gap-2">
            <AvatarInitials name={holder.name} className="size-6 text-[10px]" />
            <span className="truncate text-[13px] font-semibold text-[var(--admin-ink)]">
              {holder.name}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-[13px] font-semibold text-[var(--role-admin)]">Vacant</p>
        )}
      </div>
    </div>
  );
}

function DesignationStatus({ holder }: { holder?: AdminUser }) {
  if (!holder) {
    return (
      <span className="text-[12px] font-semibold text-[var(--role-admin)]">Vacant</span>
    );
  }
  return (
    <span className="truncate text-[12px] font-semibold text-[var(--admin-ink)]">
      {holder.name}
    </span>
  );
}

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-3 last:border-b-0">
      <span className="text-[12px] text-[var(--admin-muted)]">{label}</span>
      {children}
    </div>
  );
}

function ToolRow({
  icon,
  label,
  description,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--admin-border)] bg-[var(--admin-page)] px-4 py-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)]">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-[var(--admin-ink)]">{label}</span>
          <span className="mt-0.5 block truncate text-[11px] text-[var(--admin-faint)]">
            {description}
          </span>
        </span>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="shrink-0 border-[var(--admin-border)] bg-[var(--admin-surface)]"
      >
        Run
      </Button>
    </div>
  );
}

function QuickAction({
  to,
  label,
  description,
}: {
  to: "/app/admin/users" | "/app/admin/notifications" | "/app/admin/rates";
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 transition-colors hover:border-[var(--admin-navy)]/40 hover:bg-[var(--admin-hover)] active:translate-y-px"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-[var(--admin-ink)]">{label}</span>
        <span className="mt-1 block truncate text-[11px] text-[var(--admin-faint)]">
          {description}
        </span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-[var(--admin-faint)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <PageShell maxWidth="7xl" dashboardRole="admin" className="space-y-6 px-5 py-6 lg:px-8">
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded bg-[var(--admin-border)]" />
        <div className="h-10 w-64 animate-pulse rounded bg-[var(--admin-border)]" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-[var(--admin-border)]" />
      </div>
      <div className="grid gap-px overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-border)] sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse bg-[var(--admin-surface)] p-4" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="h-[300px] animate-pulse rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)]" />
        <div className="h-[300px] animate-pulse rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)]" />
      </div>
    </PageShell>
  );
}
