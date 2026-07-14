import { buildTaskContext } from "@/entities/task";
import { RoleBadge } from "@/entities/user";
import { MangakaDashboard } from "@/features/mangaka";
import {
  useMangakaReviewQueueQuery,
  useMyChaptersQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
} from "@/features/series";
import { ROLE_LABEL, useAuth } from "@/shared/auth";
import { formatDateTime } from "@/shared/lib/format-date";
import { MetricCard, MetricGrid, Panel, StatusPill } from "@/shared/ui";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

const STATS: Record<string, { label: string; value: string; hint: string }[]> = {
  assistant: [
    { label: "Active tasks", value: "5", hint: "" },
    { label: "Pending submission", value: "2", hint: "" },
    { label: "Earnings (calc.)", value: "¥184,000", hint: "Awaiting confirmation" },
    { label: "Paid this month", value: "¥220,000", hint: "" },
  ],
  editor: [
    { label: "Proposals to review", value: "4", hint: "" },
    { label: "Final reviews", value: "9", hint: "" },
    { label: "Ready to publish", value: "3", hint: "" },
    { label: "At-risk series", value: "1", hint: "" },
  ],
  board: [
    { label: "Proposals to vote", value: "2", hint: "" },
    { label: "Series under governance", value: "18", hint: "" },
    { label: "Cancellation cases", value: "1", hint: "" },
    { label: "Avg approval time", value: "2.3d", hint: "" },
  ],
};

const QUEUE_TITLE: Record<string, string> = {
  assistant: "Your Tasks",
  editor: "Review queue",
  board: "Proposals awaiting vote",
};

const QUEUE: Record<string, { id: string; title: string; meta: string; status: string }[]> = {
  assistant: [
    {
      id: "t1",
      title: "Berserk Ch.378 — Region 04 inking",
      meta: "Due thg 6/26 • Mangaka: Inoue",
      status: "in_progress",
    },
    {
      id: "t2",
      title: "Vagabond Ch.328 — Background page 12",
      meta: "Due thg 6/24 • Mangaka: Inoue",
      status: "revision_requested",
    },
    { id: "t3", title: "Slam Dunk reissue — Tone work", meta: "Due thg 6/30", status: "todo" },
  ],
  editor: [
    {
      id: "e1",
      title: "Vagabond Ch.327 — Final review",
      meta: "Mangaka approved • 1h ago",
      status: "submitted",
    },
    {
      id: "e2",
      title: "Berserk proposal PR-118 — Volume 42 plan",
      meta: "Forwarded by Mangaka",
      status: "submitted",
    },
    {
      id: "e3",
      title: "Monster reissue Ch.05 — Ready check",
      meta: "All tasks approved",
      status: "ready",
    },
  ],
  board: [
    {
      id: "b1",
      title: "Proposal PR-118 — Berserk Vol. 42",
      meta: "Forwarded 2d ago • 3/5 voted",
      status: "submitted",
    },
    {
      id: "b2",
      title: "Cancellation review — Series ABC",
      meta: "Risk reason: ranking drop",
      status: "at_risk",
    },
    { id: "b3", title: "Quarterly governance decision ledger", meta: "Draft", status: "draft" },
  ],
};

const UPCOMING: Record<string, string[]> = {
  assistant: [
    "Berserk Ch.378 submission — thg 6/26",
    "Vagabond revision — thg 6/24",
    "Monthly earnings cutoff — thg 6/30",
  ],
  editor: [
    "Final review Vagabond Ch.327",
    "Schedule publication Berserk Ch.377",
    "Risk meeting — thg 6/27",
  ],
  board: [
    "Vote PR-118 — closes thg 6/25",
    "Quarterly publishing schedule",
    "At-risk hearing — thg 6/27",
  ],
};

export function DashboardPage() {
  const user = useAuth((s) => s.user);

  if (!user) return null;
  if (user.role === "mangaka") return <MangakaDashboard />;
  if (user.role === "admin") {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <RoleBadge role={user.role} />
        <h1 className="font-serif text-4xl">Admin User Management</h1>
        <p className="text-sm text-muted-foreground">
          Admin MVP scope is account creation, role assignment, account lock/unlock, and password
          reset.
        </p>
        <Link
          to="/app/admin/users"
          className="inline-flex rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          Open User Management
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <RoleBadge role={user.role} />
          <h1 className="mt-3 font-serif text-5xl leading-none">
            おかえり, <span className="italic">{user.name.split(" ")[0]}</span>.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Workflow overview for the <b>{ROLE_LABEL[user.role]}</b> role. Use the role navigation
            to continue active MangaFlow work.
          </p>
        </div>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to public site
        </Link>
      </header>

      <MetricGrid>
        {STATS[user.role].map((s) => {
          return <MetricCard key={s.label} label={s.label} value={s.value} hint={s.hint || " "} />;
        })}
      </MetricGrid>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel
          title={QUEUE_TITLE[user.role]}
          action={
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Overview
            </span>
          }
        >
          <ul className="divide-y divide-border">
            {QUEUE[user.role].map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{row.meta}</p>
                </div>
                <StatusPill status={row.status} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Upcoming">
          <ul className="space-y-3 text-sm">
            {UPCOMING[user.role].map((u) => (
              <li key={u} className="flex items-start gap-3 border-l-2 border-accent pl-3">
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Panel title="MVP workflow scope" contentClassName="text-sm text-[var(--admin-muted)]">
        MangaFlow MVP connects Proposal review, Board finalization, Series production, Task review,
        Publication, Ranking, At-risk governance, Notifications, and Assistant Earnings.
      </Panel>
    </div>
  );
}
