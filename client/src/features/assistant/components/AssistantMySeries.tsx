import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, Inbox, Loader2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/layouts/AppShell";
import type { Series, SeriesMember } from "@/shared/api/series";
import { useAcceptSeriesMemberInvite, useMySeriesMemberships } from "@/shared/queries/useSeries";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";

function idOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const record = value as { id?: string; _id?: string };
  return record.id ?? record._id ?? "";
}

function seriesOf(member: SeriesMember): Series | undefined {
  return typeof member.seriesId === "object" ? member.seriesId : member.series;
}

function statusOf(member: SeriesMember) {
  return member.status.toLowerCase();
}

export function AssistantMySeries() {
  const { data: memberships = [], isLoading, error } = useMySeriesMemberships();

  const invited = memberships.filter((member) => statusOf(member) === "invited");
  const active = memberships.filter((member) => statusOf(member) === "active");
  const paused = memberships.filter((member) => statusOf(member) === "paused");

  return (
    <div className="space-y-5">
      <PageHeader
        title="My series"
        jp="参加シリーズ"
        description="Accept team invites, then work only on tasks assigned to you."
      />

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-md border border-foreground/10 bg-card"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm font-medium text-destructive">
          Unable to load your series memberships.
        </div>
      ) : memberships.length === 0 ? (
        <EmptyState text="No series invites or active memberships yet." />
      ) : (
        <>
          {invited.length > 0 && (
            <section className="rounded-md border border-amber-500/20 bg-amber-500/[0.04]">
              <div className="flex items-center justify-between gap-3 border-b border-amber-500/15 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Pending invites
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-foreground/55">
                    Accept an invite before Mangaka can assign tasks to you.
                  </p>
                </div>
                <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-700">
                  {invited.length}
                </span>
              </div>
              <div className="grid gap-3 p-3 md:grid-cols-2">
                {invited.map((member) => (
                  <InviteCard key={idOf(member.id ?? member._id)} member={member} />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-bold text-foreground">Active production teams</h2>
                <p className="mt-1 text-[11px] font-medium text-foreground/50">
                  These are the series where you can receive assigned work.
                </p>
              </div>
              {paused.length > 0 && (
                <span className="text-[11px] font-medium text-foreground/45">
                  {paused.length} paused
                </span>
              )}
            </div>

            {active.length === 0 ? (
              <EmptyState text="No active series team yet. Accept an invite to become eligible." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {active.map((member) => (
                  <SeriesCard key={idOf(member.id ?? member._id)} member={member} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function InviteCard({ member }: { member: SeriesMember }) {
  const series = seriesOf(member);
  const seriesId = idOf(member.seriesId);
  const memberId = idOf(member.id ?? member._id);
  const acceptInvite = useAcceptSeriesMemberInvite(seriesId);

  return (
    <div className="rounded-md border border-amber-500/20 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-foreground line-clamp-1">
            {series?.title ?? "Untitled series"}
          </div>
          <div className="mt-1 text-[11px] text-foreground/55 line-clamp-2">
            {series?.synopsis || "You were invited to join this production team."}
          </div>
        </div>
        <span className="shrink-0 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-700">
          INVITED
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/55">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
          Task eligible after accept
        </div>
        <button
          type="button"
          onClick={() => acceptInvite.mutate(memberId || undefined)}
          disabled={acceptInvite.isPending}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#061A2B] px-3 text-[11px] font-bold text-white transition-colors hover:bg-[#0B2A43] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600"
        >
          {acceptInvite.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Accept
        </button>
      </div>
    </div>
  );
}

function SeriesCard({ member }: { member: SeriesMember }) {
  const series = seriesOf(member);

  return (
    <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-foreground line-clamp-1">
              {series?.title ?? "Untitled series"}
            </div>
            <div className="mt-1 text-[11px] text-foreground/55 line-clamp-2">
              {series?.synopsis || "Active production team membership."}
            </div>
          </div>
          {series?.status && <StatusBadge status={series.status.toLowerCase()} />}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded border border-emerald-500/15 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
            ACTIVE
          </span>
          <span className="inline-flex items-center rounded border border-foreground/10 bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/70">
            {member.accessScope === "TASK_ONLY" ? "Task only" : "Full access"}
          </span>
        </div>
      </div>
      <Link
        to="/app/assistant/tasks"
        className="flex items-center justify-between border-t border-foreground/10 bg-background px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        View my tasks <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/15 bg-card py-14 text-foreground/55">
      <Inbox className="h-5 w-5" />
      <span className="text-[12px]">{text}</span>
    </div>
  );
}
