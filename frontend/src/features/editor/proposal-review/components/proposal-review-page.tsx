import { useMemo } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Lock, Unlock, ShieldCheck } from "lucide-react";
import { useAuth, isEditorInChief, type User } from "@/shared/auth";
import {
  useProposalActionMutation,
  useProposalQuery,
  useProposalVersionsQuery,
} from "@/features/proposals";
import {
  AUDIENCE_LABEL,
  STATUS_LABEL,
  type SeriesProposal,
} from "@/entities/proposal/model/proposal-types";
import { formatDateTime } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { SeparationOfDutiesWarning } from "@/entities/access";
import { EditorialChecklist } from "./editorial-checklist";
import { isEditorialChecklistComplete } from "../model/editorial-checklist";
import { DecisionActions } from "@/shared/ui/decision-actions";
import { ReviewStatusPill } from "@/entities/submission";
import { toast } from "sonner";
import { MaterialsViewer } from "@/entities/proposal";

const EDITOR_REVIEW_STATUSES = ["PENDING_EDITOR", "EDITOR_REVIEWING", "RESUBMITTED"];

export function ProposalReviewPage() {
  const { proposalId } = useParams({ from: "/app/editor/proposals/$proposalId" });
  const user = useAuth((s) => s.user);
  const { data: proposal, isLoading } = useProposalQuery(proposalId);
  const { data: proposalVersions = [] } = useProposalVersionsQuery(proposalId);
  const actionMutation = useProposalActionMutation(proposalId);

  const isSelf = !!proposal && !!user && proposal.authorId === user.id;

  // Claim state
  const isUnclaimed = !!proposal && !proposal.claimedByEditorId;
  const isClaimedByMe = !!proposal && !!user && proposal.claimedByEditorId === user.id;
  const isClaimedByOther = !!proposal && !!proposal.claimedByEditorId && !isClaimedByMe;
  const isEicOrAdmin =
    !!user && (user.role === "admin" || (user.role === "editor" && isEditorInChief(user)));

  // Only the editor who claimed the review can update it or make a decision.
  const canDecide = isClaimedByMe;
  const isEditorReview = !!proposal && EDITOR_REVIEW_STATUSES.includes(proposal.status);
  const checklistComplete = isEditorialChecklistComplete(proposal?.editorialChecklist);
  const supportsForward = isEditorReview && !isSelf && canDecide && checklistComplete;
  const supportsRevision = isEditorReview && !isSelf && canDecide;
  const supportsReject = isEditorReview && !isSelf && canDecide;

  const latestMs = proposal?.manuscripts[proposal.manuscripts.length - 1];

  const history = useMemo(() => proposal?.history ?? [], [proposal]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="mx-auto max-w-4xl p-10">
        <EmptyState title="Proposal not found" description="This proposal may have been deleted." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-6 overflow-x-hidden p-6">
      <div>
        <Link
          to="/app/editor/review"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Editorial queue
        </Link>
      </div>

      <header className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Proposal package review
            </p>
            <h1 className="mt-1 font-serif text-3xl">{proposal.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              One editorial decision for proposal information, manuscript, sample pages, creative
              materials, checklist, and notes.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {proposal.authorName} · {AUDIENCE_LABEL[proposal.targetAudience]} ·{" "}
              {proposal.genres.join(", ")} · v{latestMs?.version ?? "—"}
            </p>
          </div>
          <ReviewStatusPill status={proposal.status} />
        </div>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
        <section className="min-w-0 space-y-4">
          <Block title="Proposal Summary">
            <Field label="Logline" value={proposal.logline ?? "—"} />
            <Field label="Hook" value={proposal.hook ?? "—"} />
            <Field label="Synopsis" value={proposal.synopsis} />
            <Field label="Main characters" value={proposal.mainCharacters ?? "—"} />
            {proposal.advanced ? (
              <>
                <Field label="World" value={proposal.advanced.worldSetting ?? "—"} />
                <Field label="Direction" value={proposal.advanced.seriesDirection ?? "—"} />
                <Field label="Comparable" value={proposal.advanced.comparableTitles ?? "—"} />
              </>
            ) : null}
          </Block>

          <Block title="Manuscript, sample pages, and creative materials">
            {proposal.materials.length === 0 &&
            proposal.manuscripts.length === 0 &&
            !proposal.sampleChapterUrl ? (
              <p className="text-xs text-muted-foreground">No materials yet</p>
            ) : (
              <MaterialsViewer proposal={proposal} user={user} annotationLabel="Review notes" />
            )}
          </Block>

          <Block title="Version history">
            <ul className="space-y-1.5">
              {history.map((h) => (
                <li key={h.id} className="text-xs">
                  <span className="font-semibold">{h.type}</span>
                  {h.fromStatus ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {STATUS_LABEL[h.fromStatus]} → {h.toStatus ? STATUS_LABEL[h.toStatus] : ""}
                    </span>
                  ) : null}
                  <span className="text-muted-foreground">
                    {" "}
                    · {h.actorName} · {formatDateTime(h.createdAt)}
                  </span>
                  {h.comment ? <p className="text-muted-foreground">"{h.comment}"</p> : null}
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Frozen review versions">
            {proposalVersions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No frozen proposal versions yet. A version will be created when a Board voting
                session is opened.
              </p>
            ) : (
              <ul className="space-y-2">
                {proposalVersions.map((version) => (
                  <li
                    key={version.id}
                    className="rounded-md border border-border bg-background/60 px-3 py-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        Version {version.proposalVersionId}
                        {version.versionNumber ? ` · #${version.versionNumber}` : ""}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {version.status}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Source {version.source} · frozen{" "}
                      {version.frozenAt ? formatDateTime(version.frozenAt) : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Block>
        </section>

        <aside className="min-w-0 space-y-4">
          {/* Claim status banner */}
          <ClaimStatusCard
            proposal={proposal}
            user={user}
            isUnclaimed={isUnclaimed}
            isClaimedByMe={isClaimedByMe}
            isClaimedByOther={isClaimedByOther}
            isEicOrAdmin={isEicOrAdmin}
            actionMutation={actionMutation}
          />

          <EditorialChecklist
            value={proposal.editorialChecklist}
            editable={isEditorReview && isClaimedByMe && !isSelf}
            saving={actionMutation.isPending}
            onChange={(editorialChecklist) =>
              actionMutation.mutate(
                { action: "UPDATE_EDITORIAL_CHECKLIST", payload: { editorialChecklist } },
                {
                  onError: (err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Failed to save the checklist.",
                    ),
                },
              )
            }
          />

          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Decision
            </p>
            {isSelf && (
              <div className="mt-2">
                <SeparationOfDutiesWarning reason="SELF_APPROVAL_BLOCKED" />
              </div>
            )}
            {isUnclaimed && !isSelf && (
              <p className="mt-2 text-xs text-muted-foreground">
                You need to claim the review (Start Review) before making a decision.
              </p>
            )}
            {isClaimedByOther && !isEicOrAdmin && (
              <p className="mt-2 text-xs text-muted-foreground">
                <Lock className="mr-1 inline size-3" />
                This proposal is being reviewed by {proposal.claimedByEditorName}. You can only
                view.
              </p>
            )}
            <div className="mt-3">
              <DecisionActions
                actions={[
                  {
                    key: "forward",
                    label: "Send to Board",
                    variant: "primary",
                    supported: supportsForward,
                    disabledReason: !isClaimedByMe
                      ? "Claim this review before making a decision."
                      : !checklistComplete
                        ? "Complete all six Board-readiness criteria first."
                        : undefined,
                    onAct: () =>
                      actionMutation.mutate(
                        { action: "FORWARD" },
                        {
                          onSuccess: () => toast.success("Forwarded to Board."),
                          onError: (err) =>
                            toast.error(
                              err instanceof Error ? err.message : "Failed to forward to Board.",
                            ),
                        },
                      ),
                  },
                  {
                    key: "revise",
                    label: "Request Revision",
                    variant: "warn",
                    requiresReason: true,
                    supported: supportsRevision,
                    disabledReason: "Claim this review before making a decision.",
                    onAct: (reason) =>
                      actionMutation.mutate(
                        { action: "REQUEST_CHANGES", payload: { comment: reason } },
                        {
                          onSuccess: () => toast.success("Revision requested."),
                          onError: (err) =>
                            toast.error(
                              err instanceof Error ? err.message : "Failed to request revision.",
                            ),
                        },
                      ),
                  },
                  {
                    key: "reject",
                    label: "Reject",
                    variant: "danger",
                    requiresReason: true,
                    supported: supportsReject,
                    disabledReason: "Claim this review before making a decision.",
                    onAct: (reason) =>
                      actionMutation.mutate(
                        { action: "REJECT", payload: { comment: reason } },
                        {
                          onSuccess: () => toast.success("Proposal rejected."),
                          onError: (err) =>
                            toast.error(err instanceof Error ? err.message : "Failed to reject."),
                        },
                      ),
                  },
                ]}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ClaimStatusCard({
  proposal,
  user,
  isUnclaimed,
  isClaimedByMe,
  isClaimedByOther,
  isEicOrAdmin,
  actionMutation,
}: {
  proposal: SeriesProposal;
  user: User;
  isUnclaimed: boolean;
  isClaimedByMe: boolean;
  isClaimedByOther: boolean;
  isEicOrAdmin: boolean;
  actionMutation: ReturnType<typeof useProposalActionMutation>;
}) {
  if (!EDITOR_REVIEW_STATUSES.includes(proposal.status)) return null;

  if (isUnclaimed) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2">
          <Unlock className="size-4 text-emerald-600" />
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            This proposal is awaiting review
          </p>
        </div>
        <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
          Click "Claim Review" to start editing. Only you will be able to make decisions after
          claiming.
        </p>
        <button
          type="button"
          disabled={actionMutation.isPending}
          onClick={() =>
            actionMutation.mutate(
              { action: "CLAIM" },
              {
                onSuccess: () => toast.success("Proposal review claimed."),
                onError: (err: unknown) =>
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Unable to claim — another editor may have already claimed it.",
                  ),
              },
            )
          }
          className="mt-3 inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {actionMutation.isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ShieldCheck className="size-3" />
          )}
          Claim Review
        </button>
      </div>
    );
  }

  if (isClaimedByMe) {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-blue-600" />
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
            You are reviewing this proposal
          </p>
        </div>
        <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-400">
          You can make a decision: Request Revision, Reject, or Forward to Board.
        </p>
        {proposal.claimedAt && (
          <p className="mt-1 text-[10px] text-blue-600 dark:text-blue-400">
            Claimed at: {formatDateTime(proposal.claimedAt)}
          </p>
        )}
      </div>
    );
  }

  if (isClaimedByOther) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-amber-600" />
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
            Being reviewed by {proposal.claimedByEditorName}
          </p>
        </div>
        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
          You can only view the content. Decisions can only be made by the editor who claimed the
          review.
        </p>
        {proposal.claimedAt && (
          <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
            Claimed at: {formatDateTime(proposal.claimedAt)}
          </p>
        )}
        {isEicOrAdmin && (
          <button
            type="button"
            disabled={actionMutation.isPending}
            onClick={() =>
              actionMutation.mutate(
                { action: "RELEASE_CLAIM" },
                {
                  onSuccess: () => toast.success("Claim released."),
                  onError: (err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Failed to release claim."),
                },
              )
            }
            className="mt-3 inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60"
          >
            {actionMutation.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Unlock className="size-3" />
            )}
            Release Claim
          </button>
        )}
      </div>
    );
  }

  return null;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="mt-3 min-w-0 space-y-2 overflow-hidden">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
