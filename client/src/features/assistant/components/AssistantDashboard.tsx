import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRole } from "@/shared/lib/role";
import { currentUserByRole, findChapter, findSeries } from "@/entities";
import { PageHeader, StatCard } from "@/layouts/AppShell";
import { Panel } from "@/features/dashboard/components/Panel";
import { payrollMoney } from "@/shared/lib/format";
import { useAssistantTasks } from "../hooks/useAssistantTasks";
import { payrollApi, type PayrollEarning } from "@/shared/api/payroll";
import { AssistantTaskCard } from "./AssistantTaskCard";
import { AlertTriangle, Clock, Eye, Sparkles, ArrowRight, Inbox } from "lucide-react";
import { parseDeadline } from "@/features/tasks/lib/deadline";

export function AssistantDashboard() {
  const { role } = useRole();
  const me = currentUserByRole[role];
  const { mine, byStatus, counts } = useAssistantTasks(me.id);
  const { data: earnings = [], isLoading: isEarningsLoading } = useQuery({
    queryKey: ["assistant", "earnings"],
    queryFn: payrollApi.listEarnings,
  });
  const totals = calculateAssistantEarningTotals(earnings);

  const sortByDue = (list: typeof mine) =>
    [...list].sort((a, b) => {
      const da = parseDeadline(a.deadline)?.getTime() ?? Infinity;
      const db = parseDeadline(b.deadline)?.getTime() ?? Infinity;
      return da - db;
    });

  const needsAttention = sortByDue(byStatus["revision-requested"]);
  const inProgress = sortByDue(byStatus["in-progress"]);
  const waiting = sortByDue([...byStatus.submitted, ...byStatus["mangaka-approved"]]);
  const completed = byStatus["editor-approved"].slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's work"
        jp="本日の作業"
        description="Your assigned tasks, what's waiting on review, and what's been approved."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="My tasks" value={String(counts.all)} />
        <StatCard label="In progress" value={String(counts["in-progress"])} />
        <StatCard
          label="Under review"
          value={String(counts.submitted + counts["mangaka-approved"])}
        />
        <StatCard
          label="Revision requested"
          value={String(counts["revision-requested"])}
          hint={counts["revision-requested"] > 0 ? "Needs your attention" : undefined}
        />
        <StatCard
          label="Completed"
          value={String(counts["editor-approved"])}
          hint="Editor approved"
        />
        <StatCard
          label="Earnings"
          value={isEarningsLoading ? "..." : payrollMoney(totals.thisMonth, totals.currency)}
          hint={`${payrollMoney(totals.pending, totals.currency)} pending`}
        />
      </div>

      {needsAttention.length > 0 && (
        <Panel
          title="Needs your attention"
          action={
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              {needsAttention.length} revision{needsAttention.length === 1 ? "" : "s"}
            </span>
          }
        >
          <div className="grid gap-2 p-3 md:grid-cols-2 lg:grid-cols-3">
            {needsAttention.map((t) => (
              <AssistantTaskCard key={taskRenderKey(t)} task={t} />
            ))}
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="In progress"
          action={
            <span className="inline-flex items-center gap-1 text-[11px] text-foreground/55">
              <Clock className="h-3.5 w-3.5" /> {inProgress.length}
            </span>
          }
        >
          {inProgress.length === 0 ? (
            <EmptyRow icon={Clock} text="Nothing in progress." />
          ) : (
            <div className="space-y-2 p-3">
              {inProgress.map((t) => (
                <AssistantTaskCard key={taskRenderKey(t)} task={t} />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Waiting review"
          action={
            <span className="inline-flex items-center gap-1 text-[11px] text-foreground/55">
              <Eye className="h-3.5 w-3.5" /> {waiting.length}
            </span>
          }
        >
          {waiting.length === 0 ? (
            <EmptyRow icon={Eye} text="No submissions awaiting review." />
          ) : (
            <div className="space-y-2 p-3">
              {waiting.map((t) => {
                const ch = findChapter(t.chapterId);
                const series = ch ? findSeries(ch.seriesId) : null;
                const isMangakaApproved = t.status === "mangaka-approved";
                const reviewer = isMangakaApproved ? "Editor" : "Mangaka";
                return (
                  <div
                    key={t.id}
                    className="rounded-md border border-foreground/10 bg-background p-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="font-medium text-foreground line-clamp-1">
                        {series?.title} · {ch?.number}
                      </span>
                      <span className="text-[11px] text-foreground/55">
                        v{t.currentVersion ?? 1}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-foreground/60">
                      {t.type} · {t.pageRange}
                    </div>
                    <div className="mt-1 text-[11px] text-foreground/55">
                      {isMangakaApproved
                        ? "Mangaka approved. Earnings unlock after Editor final approval."
                        : `Awaiting ${reviewer} review`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Recently completed"
        action={
          <Link
            to="/app/assistant/earnings"
            className="inline-flex items-center gap-1 text-[11px] text-foreground/60 hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" /> Earnings <ArrowRight className="h-3 w-3" />
          </Link>
        }
      >
        {completed.length === 0 ? (
          <EmptyRow icon={Sparkles} text="No completed tasks yet." />
        ) : (
          <div className="grid gap-2 p-3 md:grid-cols-2 lg:grid-cols-3">
            {completed.map((t) => (
              <AssistantTaskCard key={taskRenderKey(t)} task={t} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function taskRenderKey(task: {
  id?: string;
  chapterId: string;
  pageId?: string;
  title?: string;
  type: string;
}) {
  return task.id || `${task.chapterId}-${task.pageId ?? "chapter"}-${task.title ?? task.type}`;
}

function EmptyRow({ icon: Icon, text }: { icon: typeof Inbox; text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-6 text-[12px] text-foreground/55">
      <Icon className="h-4 w-4" /> {text}
    </div>
  );
}

function calculateAssistantEarningTotals(earnings: PayrollEarning[]) {
  const effective = earnings.filter(
    (earning) => normalizePayrollStatus(earning.status) !== "voided",
  );
  const pending = effective
    .filter((earning) => normalizePayrollStatus(earning.status) === "calculated")
    .reduce((total, earning) => total + Number(earning.amount ?? 0), 0);
  return {
    thisMonth: effective.reduce((total, earning) => total + Number(earning.amount ?? 0), 0),
    pending,
    currency: effective[0]?.currency ?? "VND",
  };
}

function normalizePayrollStatus(status: PayrollEarning["status"]) {
  const normalized = String(status).toUpperCase();
  if (normalized === "VOID") return "voided";
  if (normalized === "PENDING") return "calculated";
  return normalized.toLowerCase();
}
