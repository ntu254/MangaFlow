import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/layouts/AppShell";
import { AuditTimeline } from "@/shared/ui/site/AuditTimeline";
import { useRole } from "@/shared/lib/role";
import { canEditorReview } from "@/shared/lib/permissions";
import {
  useEditorForwardToBoard,
  useEditorRejectSeries,
  useEditorRequestRevision,
  useEditorSeriesReview,
} from "@/shared/queries/useEditorReview";
import type { PublicationType } from "@/shared/api/series";

export const Route = createFileRoute("/app/editor/series/$id/review")({
  component: EditorReviewDetail,
});

function EditorReviewDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { role } = useRole();
  const { data: review, isLoading } = useEditorSeriesReview(id);

  const [decision, setDecision] = useState<"revision" | "reject" | "forward">("forward");
  const [comment, setComment] = useState("");
  const [publicationType, setPublicationType] = useState<PublicationType>("WEEKLY");

  const requestRevision = useEditorRequestRevision(id);
  const rejectSeries = useEditorRejectSeries(id);
  const forwardToBoard = useEditorForwardToBoard(id);
  const isSubmitting =
    requestRevision.isPending || rejectSeries.isPending || forwardToBoard.isPending;

  if (isLoading || !review) {
    return <div className="p-8 text-center text-sm text-foreground/55">Loading review...</div>;
  }

  const { series, manuscript } = review;
  const perm = canEditorReview(role, series);

  async function submit() {
    if (!perm.allowed) return toast.error(perm.reason);
    const trimmed = comment.trim();
    if (!trimmed) return toast.error("Add a review comment.");

    if (decision === "revision") {
      await requestRevision.mutateAsync({
        revisionReason: trimmed,
        feedbackSummary: trimmed,
        reviewNote: trimmed,
      });
    } else if (decision === "reject") {
      await rejectSeries.mutateAsync({
        rejectReason: trimmed,
        reviewNote: trimmed,
      });
    } else {
      await forwardToBoard.mutateAsync({
        editorRecommendation: trimmed,
        feasibilityNote: trimmed,
        suggestedPublicationType: publicationType,
      });
    }

    router.navigate({ to: "/app/editor/series-review" });
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <PageHeader
          title={series.title}
          jp="編集レビュー"
          description={
            <Link to="/app/editor/series-review" className="underline-offset-2 hover:underline">
              ← Review queue
            </Link>
          }
        />

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-foreground/55">Proposal</div>
          <div className="mt-2 text-sm">{series.synopsis}</div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-foreground/55">Requested cadence</dt>
              <dd className="font-medium">{series.requestedPublicationType ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">Genres</dt>
              <dd className="font-medium">
                {series.genres.length ? series.genres.join(", ") : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">Audience</dt>
              <dd className="font-medium">{series.targetAudience ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">Status</dt>
              <dd className="font-medium">{series.status}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          <div className="mb-3 text-[10px] uppercase tracking-wider text-foreground/55">
            Latest manuscript
          </div>
          <div className="rounded border border-foreground/10 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">Version {manuscript.version}</div>
              <div className="text-xs text-foreground/55">{manuscript.status}</div>
            </div>
            {manuscript.reviewNote && (
              <div className="mt-2 text-xs text-foreground/70">{manuscript.reviewNote}</div>
            )}
          </div>
        </div>

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          <div className="mb-3 text-[10px] uppercase tracking-wider text-foreground/55">
            Decision
          </div>
          {!perm.allowed && (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              {perm.reason}
            </div>
          )}
          <div className="mb-3 flex gap-2">
            {(["forward", "revision", "reject"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setDecision(value)}
                className={`h-8 rounded-md px-3 text-xs font-bold capitalize ${
                  decision === value
                    ? "bg-foreground text-background"
                    : "border border-foreground/15 hover:bg-foreground/5"
                }`}
              >
                {value === "forward"
                  ? "Forward to Board"
                  : value === "revision"
                    ? "Request revision"
                    : "Reject"}
              </button>
            ))}
          </div>

          {decision === "forward" && (
            <label className="mb-3 block text-xs font-semibold text-foreground/70">
              Suggested publication type
              <select
                value={publicationType}
                onChange={(event) => setPublicationType(event.target.value as PublicationType)}
                className="mt-1 h-9 w-full rounded-md border border-foreground/15 bg-background px-3 text-sm"
              >
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
              </select>
            </label>
          )}

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={
              decision === "forward"
                ? "Recommendation and feasibility note for Board..."
                : decision === "revision"
                  ? "Revision reason and feedback summary for the Mangaka..."
                  : "Reject reason for the Mangaka..."
            }
            rows={4}
            className="w-full rounded-md border border-foreground/15 bg-background p-3 text-sm"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={submit}
              disabled={!perm.allowed || isSubmitting}
              className="h-9 rounded-md bg-foreground px-4 text-xs font-bold text-background disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit decision"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-md border border-foreground/10 bg-card p-4">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-foreground/55">
            Editor notes
          </div>
          <div className="space-y-2 text-xs text-foreground/70">
            {manuscript.editorRecommendation && <div>{manuscript.editorRecommendation}</div>}
            {manuscript.feasibilityNote && <div>{manuscript.feasibilityNote}</div>}
            {manuscript.riskNote && <div>{manuscript.riskNote}</div>}
            {!manuscript.editorRecommendation &&
              !manuscript.feasibilityNote &&
              !manuscript.riskNote && (
                <div className="text-foreground/55">No prior editor notes.</div>
              )}
          </div>
        </div>
        <AuditTimeline entity="series" entityId={series.id} limit={10} />
      </div>
    </div>
  );
}
