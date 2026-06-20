import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import {
  findSeries,
  proposalBySeries,
  manuscriptBySeries,
  versionsByManuscript,
  reviewsBySeries,
  findStaff,
  currentUserByRole,
} from "@/entities";
import { AuditTimeline } from "@/shared/ui/site/AuditTimeline";
import { useState } from "react";
import { useRole } from "@/shared/lib/role";
import { canEditorReview } from "@/shared/lib/permissions";
import { logAudit } from "@/shared/lib/audit";
import { notify } from "@/shared/lib/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/app/editor/series/$id/review")({
  loader: ({ params }) => {
    const s = findSeries(params.id);
    if (!s) throw notFound();
    return { series: s };
  },
  component: EditorReviewDetail,
});

function EditorReviewDetail() {
  const { series } = Route.useLoaderData();
  const router = useRouter();
  const { role } = useRole();
  const me = currentUserByRole[role];
  const perm = canEditorReview(role, series);

  const proposal = proposalBySeries(series.id);
  const manuscript = manuscriptBySeries(series.id);
  const versions = manuscript ? versionsByManuscript(manuscript.id) : [];
  const reviews = reviewsBySeries(series.id);

  const [decision, setDecision] = useState<"revision" | "reject" | "forward">("forward");
  const [comment, setComment] = useState("");

  function submit() {
    if (!perm.allowed) return toast.error(perm.reason);
    if (!comment.trim()) return toast.error("Add a review comment.");
    const typeMap = {
      revision: "EDITOR_REVISION_REQUESTED",
      reject: "EDITOR_REJECTED_SERIES",
      forward: "SERIES_FORWARDED_TO_BOARD",
    } as const;
    logAudit({ type: typeMap[decision], actorId: me.id, entity: "series", entityId: series.id });
    notify(series.mangakaId, {
      type: typeMap[decision],
      title:
        decision === "forward"
          ? "Series forwarded to Board"
          : decision === "revision"
            ? "Editor requested a revision"
            : "Series rejected by Editor",
      body: `${series.title} · ${comment.slice(0, 80)}`,
      link: `/app/series/${series.id}/revisions`,
    });
    toast.success(`Recorded: ${typeMap[decision]}`);
    setComment("");
    router.navigate({ to: "/app/editor/series-review" });
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PageHeader
          title={series.title}
          jp={series.jp}
          description={
            <Link to="/app/editor/series-review" className="underline-offset-2 hover:underline">
              ← Review queue
            </Link>
          }
        />

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-foreground/55">Proposal</div>
          <div className="mt-2 text-sm">{proposal?.synopsis ?? series.synopsis}</div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-foreground/55">Requested cadence</dt>
              <dd className="font-medium capitalize">
                {proposal?.requestedPublicationType ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">Genre</dt>
              <dd className="font-medium">{proposal?.genre.join(", ") ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">Audience</dt>
              <dd className="font-medium capitalize">{proposal?.targetAudience ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">Status</dt>
              <dd className="font-medium">{series.status}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-foreground/55 mb-3">
            Manuscript versions
          </div>
          {versions.length === 0 && (
            <div className="text-xs text-foreground/55">No versions uploaded.</div>
          )}
          <div className="divide-y divide-foreground/10">
            {versions.map((v) => {
              const uploader = findStaff(v.uploadedBy);
              return (
                <div key={v.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="font-mono text-xs text-foreground/55">v{v.version}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{v.fileName}</div>
                    <div className="text-[11px] text-foreground/55">
                      {uploader?.name} · {v.uploadedAt} · {v.pageCount} pages
                    </div>
                    {v.note && <div className="mt-0.5 text-xs text-foreground/70">{v.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-foreground/55 mb-3">
            Decision
          </div>
          {!perm.allowed && (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              {perm.reason}
            </div>
          )}
          <div className="flex gap-2 mb-3">
            {(["forward", "revision", "reject"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDecision(d)}
                className={`h-8 rounded-md px-3 text-xs font-bold capitalize ${
                  decision === d
                    ? "bg-foreground text-background"
                    : "border border-foreground/15 hover:bg-foreground/5"
                }`}
              >
                {d === "forward"
                  ? "Forward to Board"
                  : d === "revision"
                    ? "Request revision"
                    : "Reject"}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave feedback for the Mangaka…"
            rows={4}
            className="w-full rounded-md border border-foreground/15 bg-background p-3 text-sm"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={submit}
              disabled={!perm.allowed}
              className="h-9 rounded-md bg-foreground px-4 text-xs font-bold text-background disabled:opacity-50"
            >
              Submit decision
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-md border border-foreground/10 bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-foreground/55 mb-2">
            Editor history
          </div>
          {reviews.length === 0 && (
            <div className="text-xs text-foreground/55">No prior reviews.</div>
          )}
          <div className="space-y-2">
            {reviews.map((r) => {
              const reviewer = findStaff(r.reviewerId);
              return (
                <div key={r.id} className="rounded border border-foreground/10 p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold uppercase tracking-wide">{r.decision}</span>
                    <span className="text-foreground/55">{r.at}</span>
                  </div>
                  <div className="mt-1">{r.comment}</div>
                  <div className="mt-1 text-foreground/55">— {reviewer?.name}</div>
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
