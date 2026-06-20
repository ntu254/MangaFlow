import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { findSeries, votesBySeries, findStaff, currentUserByRole } from "@/entities";
import { AuditTimeline } from "@/shared/ui/site/AuditTimeline";
import { useState } from "react";
import { useRole } from "@/shared/lib/role";
import { canBoardVote } from "@/shared/lib/permissions";
import { logAudit } from "@/shared/lib/audit";
import { notify } from "@/shared/lib/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/app/board/series/$id/vote")({
  loader: ({ params }) => {
    const s = findSeries(params.id);
    if (!s) throw notFound();
    return { series: s };
  },
  component: BoardVotePage,
});

function BoardVotePage() {
  const { series } = Route.useLoaderData();
  const router = useRouter();
  const { role } = useRole();
  const me = currentUserByRole[role];
  const perm = canBoardVote(role, series);
  const votes = votesBySeries(series.id);

  const [vote, setVote] = useState<"approve" | "reject" | "revision">("approve");
  const [pubType, setPubType] = useState<"weekly" | "monthly">("weekly");
  const [comment, setComment] = useState("");
  const [isChair, setIsChair] = useState(false);

  function castVote() {
    if (!perm.allowed) return toast.error(perm.reason);
    if (!comment.trim()) return toast.error("Add a comment.");
    logAudit({
      type: "BOARD_VOTE_CREATED",
      actorId: me.id,
      entity: "series",
      entityId: series.id,
      payload: { vote, suggestedPublicationType: vote === "approve" ? pubType : undefined },
    });
    notify(series.mangakaId, {
      type: "BOARD_VOTE_CAST",
      title: "Board vote cast",
      body: `${me.name} voted ${vote} on ${series.title}.`,
      link: `/app/series/${series.id}`,
    });
    toast.success("Vote recorded.");
    setComment("");
  }

  function finalize() {
    if (vote === "approve" && !pubType) return toast.error("Approve requires publicationType.");
    const type =
      vote === "approve"
        ? "SERIES_APPROVED"
        : vote === "reject"
          ? "SERIES_REJECTED"
          : "BOARD_REQUESTED_REVISION";
    logAudit({
      type,
      actorId: me.id,
      entity: "series",
      entityId: series.id,
      payload: vote === "approve" ? { publicationType: pubType } : undefined,
    });
    notify(series.mangakaId, {
      type,
      title:
        vote === "approve"
          ? `${series.title} approved (${pubType})`
          : vote === "reject"
            ? `${series.title} rejected`
            : `${series.title} — revision requested`,
      body: comment || "Final decision recorded.",
      link: `/app/series/${series.id}`,
    });
    toast.success(`Board finalised: ${type}`);
    router.navigate({ to: "/app/board/series-review" });
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PageHeader
          title={series.title}
          jp={series.jp}
          description={
            <Link to="/app/board/series-review" className="underline-offset-2 hover:underline">
              ← Board queue
            </Link>
          }
        />

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          {!perm.allowed && (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              {perm.reason}
            </div>
          )}
          <div className="text-[10px] uppercase tracking-wider text-foreground/55 mb-3">
            Your vote
          </div>
          <div className="mb-3 flex gap-2">
            {(["approve", "reject", "revision"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVote(v)}
                className={`h-8 rounded-md px-3 text-xs font-bold capitalize ${
                  vote === v
                    ? "bg-foreground text-background"
                    : "border border-foreground/15 hover:bg-foreground/5"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {vote === "approve" && (
            <div className="mb-3">
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-foreground/55">
                Publication type (required for approval — Flow 01 §16)
              </label>
              <div className="flex gap-2">
                {(["weekly", "monthly"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPubType(p)}
                    className={`h-8 rounded-md px-3 text-xs font-bold capitalize ${
                      pubType === p
                        ? "bg-emerald-600 text-white"
                        : "border border-foreground/15 hover:bg-foreground/5"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment…"
            rows={3}
            className="w-full rounded-md border border-foreground/15 bg-background p-3 text-sm"
          />
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={isChair}
                onChange={(e) => setIsChair(e.target.checked)}
              />
              I am acting as Board Chair (finalize decision)
            </label>
            <div className="flex gap-2">
              <button
                onClick={castVote}
                disabled={!perm.allowed}
                className="h-9 rounded-md border border-foreground/20 px-3 text-xs font-bold disabled:opacity-50"
              >
                Cast vote
              </button>
              <button
                onClick={finalize}
                disabled={!perm.allowed || !isChair}
                className="h-9 rounded-md bg-foreground px-4 text-xs font-bold text-background disabled:opacity-50"
              >
                Finalize as Chair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-md border border-foreground/10 bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-foreground/55 mb-2">
            Votes ({votes.length})
          </div>
          <div className="space-y-2">
            {votes.map((v) => {
              const voter = findStaff(v.voterId);
              return (
                <div key={v.id} className="rounded border border-foreground/10 p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold uppercase">{v.vote}</span>
                    <span className="text-foreground/55">{v.at}</span>
                  </div>
                  <div className="mt-1">{v.comment}</div>
                  <div className="mt-1 text-foreground/55">
                    {voter?.name}
                    {v.suggestedPublicationType && ` · suggests ${v.suggestedPublicationType}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <AuditTimeline entity="series" entityId={series.id} limit={10} />
      </div>
    </div>
  );
}
