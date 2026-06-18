import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  Database,
  DollarSign,
  FileText,
  Layers,
  Shield,
  Users,
} from 'lucide-react'
import { useAdminDashboardSummary } from '@/features/dashboard/hooks/useDashboard'
import type { AdminSidebarSummary } from '@/features/dashboard/services/dashboard.api'
import { usePageChrome } from '@/shared/components/layout/page-chrome'
import { BentoGrid, BentoCard } from '@/shared/components/layout/BentoGrid'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

type BadgeSummary = AdminSidebarSummary['sidebarBadges']

const fmtNumber = (value?: number) => new Intl.NumberFormat('en-US').format(value ?? 0)

export default function AdminDashboard() {
  const { data, isLoading, isError } = useAdminDashboardSummary()

  usePageChrome(
    {
      contextHeader: {
        title: 'Admin dashboard',
        breadcrumb: 'Admin · Overview',
        status: (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
            {isLoading ? 'Loading' : 'Live summary'}
          </span>
        ),
      },
    },
    [isLoading],
  )

  const stats = data?.stats
  const badges = data?.sidebarBadges
  const totalUsers = (stats?.activeUsers ?? 0) + (badges?.suspendedUsers ?? 0)
  const attentionItems = useMemo(() => buildAttentionItems(badges), [badges])
  const healthItems = useMemo(() => buildHealthItems(badges), [badges])

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          Could not load the admin summary. The controls below still link to their pages.
        </div>
      )}

      <BentoGrid>
        <BentoCard bare colSpan={3}>
          <MetricTile
            label="Total users"
            value={totalUsers}
            meta={`${fmtNumber(stats?.activeUsers)} active · ${fmtNumber(badges?.suspendedUsers)} suspended`}
            icon={<Users size={18} />}
            loading={isLoading}
            to="/app/admin/users"
          />
        </BentoCard>
        <BentoCard bare colSpan={3}>
          <MetricTile
            label="Board members"
            value={stats?.boardMembers}
            meta={badges?.missingBoardChair ? 'Chair needs assignment' : 'Governance ready'}
            icon={<Shield size={18} />}
            loading={isLoading}
            tone={badges?.missingBoardChair ? 'warn' : 'ok'}
            to="/app/admin/board-members"
          />
        </BentoCard>
        <BentoCard bare colSpan={3}>
          <MetricTile
            label="Task types"
            value={stats?.activeTaskTypes}
            meta={`${fmtNumber(badges?.inactiveTaskTypes)} inactive · ${fmtNumber(badges?.taskRateWarnings)} rate warnings`}
            icon={<Layers size={18} />}
            loading={isLoading}
            tone={(badges?.inactiveTaskTypes ?? 0) + (badges?.taskRateWarnings ?? 0) > 0 ? 'warn' : 'ok'}
            to="/app/admin/task-types"
          />
        </BentoCard>
        <BentoCard bare colSpan={3}>
          <MetricTile
            label="Payroll queue"
            value={badges?.pendingPayrollConfirmations}
            meta="Pending confirmations"
            icon={<DollarSign size={18} />}
            loading={isLoading}
            tone={(badges?.pendingPayrollConfirmations ?? 0) > 0 ? 'warn' : 'neutral'}
            to="/app/admin/earnings"
          />
        </BentoCard>
      </BentoGrid>

      <BentoGrid>
        <BentoCard bare colSpan={7}>
          <Panel
            title="Attention queue"
            description="Admin work that can block reviews, payroll, or publishing."
            icon={<AlertTriangle size={17} />}
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/app/admin/audit-logs">
                  Audit log <ArrowRight size={14} />
                </Link>
              </Button>
            }
          >
            {isLoading ? (
              <LoadingRows count={5} />
            ) : attentionItems.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={22} />} title="No admin blockers" body="Critical queues are clear." />
            ) : (
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <AttentionRow key={item.label} {...item} />
                ))}
              </div>
            )}
          </Panel>
        </BentoCard>

        <BentoCard bare colSpan={5}>
          <Panel title="System health" description="Operational signals from the admin summary endpoint." icon={<Activity size={17} />}>
            {isLoading ? (
              <LoadingRows count={4} />
            ) : (
              <div className="space-y-3">
                {healthItems.map((item) => (
                  <HealthRow key={item.label} {...item} />
                ))}
              </div>
            )}
          </Panel>
        </BentoCard>
      </BentoGrid>

      <BentoGrid>
        <BentoCard bare colSpan={6}>
          <Panel title="Operations map" description="Current workload shape across admin-managed systems." icon={<Database size={17} />}>
            <div className="space-y-4">
              <ProgressRow
                label="Active users"
                value={stats?.activeUsers}
                total={Math.max(totalUsers, 1)}
                loading={isLoading}
                helper={`${fmtNumber(totalUsers)} total accounts`}
              />
              <ProgressRow
                label="Active task types"
                value={stats?.activeTaskTypes}
                total={Math.max((stats?.activeTaskTypes ?? 0) + (badges?.inactiveTaskTypes ?? 0), 1)}
                loading={isLoading}
                helper={`${fmtNumber(badges?.inactiveTaskTypes)} inactive configs`}
              />
              <ProgressRow
                label="Board seats"
                value={stats?.boardMembers}
                total={Math.max(stats?.boardMembers ?? 0, 1)}
                loading={isLoading}
                helper={badges?.missingBoardChair ? 'Chair missing' : 'Chair coverage ready'}
              />
              <ProgressRow
                label="Active tasks"
                value={stats?.activeTasks}
                total={Math.max((stats?.activeTasks ?? 0) + (badges?.seriesPendingReview ?? 0), 1)}
                loading={isLoading}
                helper={`${fmtNumber(stats?.totalSeries)} series tracked`}
              />
            </div>
          </Panel>
        </BentoCard>

        <BentoCard bare colSpan={6}>
          <Panel title="Quick actions" description="Jump straight into the admin pages that change production state." icon={<Bell size={17} />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction
                to="/app/admin/users/create"
                icon={<Users size={16} />}
                title="Create user"
                body="Invite a teammate or service account."
              />
              <QuickAction
                to="/app/admin/board-members"
                icon={<Shield size={16} />}
                title="Manage board"
                body="Assign chair and board access."
              />
              <QuickAction
                to="/app/admin/task-types"
                icon={<Layers size={16} />}
                title="Configure task types"
                body="Update rates and submission rules."
              />
              <QuickAction
                to="/app/admin/earnings"
                icon={<DollarSign size={16} />}
                title="Review earnings"
                body="Confirm and mark payroll paid."
              />
              <QuickAction
                to="/app/admin/audit-logs"
                icon={<FileText size={16} />}
                title="Audit trail"
                body="Inspect privileged changes."
              />
            </div>
          </Panel>
        </BentoCard>
      </BentoGrid>
    </div>
  )
}

function buildAttentionItems(badges?: BadgeSummary) {
  if (!badges) return []

  return [
    {
      label: 'Series pending review',
      description: 'Editorial queue is waiting for admin awareness.',
      count: badges.seriesPendingReview,
      to: '/app/editor/manuscripts/review-queue',
    },
    {
      label: 'Payroll confirmations',
      description: 'Earnings are ready for admin confirmation.',
      count: badges.pendingPayrollConfirmations,
      to: '/app/admin/earnings',
    },
    {
      label: 'Task rate warnings',
      description: 'Some task type rates need verification.',
      count: badges.taskRateWarnings,
      to: '/app/admin/task-types',
    },
    {
      label: 'Critical audit events',
      description: 'Review privileged activity in the audit log.',
      count: badges.criticalAuditEvents,
      to: '/app/admin/audit-logs',
    },
    {
      label: 'Missing board chair',
      description: 'Governance needs an assigned chair.',
      count: badges.missingBoardChair ? 1 : 0,
      to: '/app/admin/board-members',
    },
    {
      label: 'Unread notifications',
      description: 'Notifications are waiting for admin review.',
      count: badges.unreadNotifications,
      to: '/app/admin/dashboard',
    },
  ].filter((item) => item.count > 0)
}

function buildHealthItems(badges?: BadgeSummary) {
  return [
    {
      label: 'Storage',
      description: 'Asset storage capacity',
      ok: !badges?.storageWarning,
      issue: 'Capacity warning',
      icon: <Database size={15} />,
    },
    {
      label: 'AI service',
      description: 'Generation provider health',
      ok: !badges?.aiUnhealthy,
      issue: 'Provider unhealthy',
      icon: <Bot size={15} />,
    },
    {
      label: 'Audit severity',
      description: 'Critical audit event count',
      ok: (badges?.criticalAuditEvents ?? 0) === 0,
      issue: `${fmtNumber(badges?.criticalAuditEvents)} critical`,
      icon: <FileText size={15} />,
    },
    {
      label: 'System warnings',
      description: 'Combined warning signal',
      ok: (badges?.systemWarnings ?? 0) === 0,
      issue: `${fmtNumber(badges?.systemWarnings)} warnings`,
      icon: <AlertTriangle size={15} />,
    },
  ]
}

function MetricTile({
  label,
  value,
  meta,
  icon,
  loading,
  tone = 'neutral',
  to,
}: {
  label: string
  value?: number
  meta: string
  icon: ReactNode
  loading: boolean
  tone?: 'neutral' | 'ok' | 'warn'
  to: string
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded-md bg-secondary" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{fmtNumber(value)}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
            tone === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
            tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-700',
            tone === 'neutral' && 'border-border bg-secondary text-muted-foreground',
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 line-clamp-1 text-xs font-medium text-muted-foreground">{loading ? 'Syncing summary...' : meta}</p>
    </Link>
  )
}

function Panel({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string
  description: string
  icon: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function AttentionRow({
  label,
  description,
  count,
  to,
}: {
  label: string
  description: string
  count: number
  to: string
}) {
  return (
    <Link
      to={to}
      className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">{label}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 tabular-nums">
          {fmtNumber(count)}
        </span>
        <ArrowRight size={15} className="text-muted-foreground" />
      </div>
    </Link>
  )
}

function HealthRow({
  label,
  description,
  ok,
  issue,
  icon,
}: {
  label: string
  description: string
  ok: boolean
  issue: string
  icon: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <span
        className={cn(
          'inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold',
          ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700',
        )}
      >
        {ok ? 'Operational' : issue}
      </span>
    </div>
  )
}

function ProgressRow({
  label,
  value,
  total,
  loading,
  helper,
}: {
  label: string
  value?: number
  total: number
  loading: boolean
  helper: string
}) {
  const percent = Math.min(100, Math.round(((value ?? 0) / total) * 100))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{loading ? 'Syncing summary...' : helper}</p>
        </div>
        <span className="font-mono text-sm font-bold text-foreground">{loading ? '--' : fmtNumber(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full bg-primary transition-all', loading && 'animate-pulse bg-muted-foreground/20')}
          style={{ width: loading ? '42%' : `${percent}%` }}
        />
      </div>
    </div>
  )
}

function QuickAction({ to, icon, title, body }: { to: string; icon: ReactNode; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>
    </Link>
  )
}

function LoadingRows({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border p-3">
          <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  )
}
