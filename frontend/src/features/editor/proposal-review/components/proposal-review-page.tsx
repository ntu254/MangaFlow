import { useMemo } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Lock, Unlock, ShieldCheck, FileText, BookOpen, History } from "lucide-react";
import { useAuth, type User } from "@/shared/auth";
import {
  useProposalActionMutation,
  useProposalQuery,
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
import { ResolvedImage } from "@/shared/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EDITOR_REVIEW_STATUSES = ["PENDING_EDITOR", "EDITOR_REVIEWING", "CHANGES_REQUESTED"];

export function ProposalReviewPage() {
  const { proposalId } = useParams({ from: "/app/editor/proposals/$proposalId" });
  const user = useAuth((s) => s.user);
  const { data: proposal, isLoading } = useProposalQuery(proposalId);
  const actionMutation = useProposalActionMutation(proposalId);

  const isSelf = !!proposal && !!user && proposal.authorId === user.id;

  // Claim state
  const isUnclaimed = !!proposal && !proposal.claimedByEditorId;
  const isClaimedByMe = !!proposal && !!user && proposal.claimedByEditorId === user.id;
  const isClaimedByOther = !!proposal && !!proposal.claimedByEditorId && !isClaimedByMe;

  // Only the editor who claimed the review can update it or make a decision.
  const canDecide = isClaimedByMe;
  const isEditorReview = !!proposal && EDITOR_REVIEW_STATUSES.includes(proposal.status);
  const checklistComplete = isEditorialChecklistComplete(proposal?.editorialChecklist);
  const supportsForward = isEditorReview && !isSelf && canDecide && checklistComplete;
  const supportsRevision = isEditorReview && !isSelf && canDecide;
  const supportsReject = isEditorReview && !isSelf && canDecide;

  const latestMs = proposal?.manuscripts[proposal.manuscripts.length - 1];
  const history = useMemo(() => proposal?.history ?? [], [proposal]);
  const materialsCount = (proposal?.manuscripts.length ?? 0) + (proposal?.materials.length ?? 0) + (proposal?.sampleChapterUrl ? 1 : 0);

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
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/app/editor/review"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Editorial Queue</span>
        </Link>
      </div>

      {/* Executive Pitch Header Banner */}
      <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 shadow-xs backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
            {/* Proposal Cover Image */}
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted shadow-xs ring-1 ring-border/40 sm:h-32 sm:w-22">
              <ResolvedImage
                fileKey={proposal.coverFileKey}
                fallbackUrl={proposal.coverUrl}
                alt={proposal.title}
                className="size-full object-cover transition-transform duration-300 hover:scale-105"
                fallback={
                  <div className="grid size-full place-items-center bg-primary/10 font-serif text-2xl font-bold text-primary">
                    {(proposal.title || "?").slice(0, 1).toUpperCase()}
                  </div>
                }
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Proposal Package Review
                </span>
                <span className="rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  v{latestMs?.version ?? "1.0"}
                </span>
                {proposal.chaptersPlanned ? (
                  <span className="rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {proposal.chaptersPlanned} chapters planned
                  </span>
                ) : null}
              </div>

              <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {proposal.title}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{proposal.authorName}</span>
                <span>•</span>
                <span className="rounded-lg border border-border/60 bg-background/50 px-2 py-0.5 font-medium text-foreground">
                  {AUDIENCE_LABEL[proposal.targetAudience]}
                </span>
                <span>•</span>
                <div className="flex flex-wrap gap-1">
                  {proposal.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <ReviewStatusPill status={proposal.status} />
          </div>
        </div>

        {/* Claim Status Banner integrated into Header */}
        <ClaimStatusHeader
          proposal={proposal}
          isUnclaimed={isUnclaimed}
          isClaimedByMe={isClaimedByMe}
          isClaimedByOther={isClaimedByOther}
          actionMutation={actionMutation}
        />
      </header>

      {/* Main Workbench Grid (7:5 Split) */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        {/* Left Column: Consolidated Space-Optimized Tabbed Workspace */}
        <section className="min-w-0">
          <Tabs defaultValue="dossier" className="w-full">
            <div className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs backdrop-blur-md space-y-5">
              <TabsList className="grid w-full grid-cols-3 h-10 rounded-xl bg-muted/60 p-1">
                <TabsTrigger value="dossier" className="flex items-center gap-2 text-xs font-semibold rounded-lg">
                  <BookOpen className="size-3.5 shrink-0" />
                  <span>Story Dossier</span>
                </TabsTrigger>
                <TabsTrigger value="materials" className="flex items-center gap-2 text-xs font-semibold rounded-lg">
                  <FileText className="size-3.5 shrink-0" />
                  <span>Materials ({materialsCount})</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-2 text-xs font-semibold rounded-lg">
                  <History className="size-3.5 shrink-0" />
                  <span>Audit History</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dossier" className="mt-0 space-y-3.5 focus-visible:outline-none">
                <Field label="Logline" value={proposal.logline ?? "—"} />
                <Field label="Core Hook" value={proposal.hook ?? "—"} />
                <Field label="Full Synopsis" value={proposal.synopsis} />
                <Field label="Main Characters" value={proposal.mainCharacters ?? "—"} />
                {proposal.advanced ? (
                  <div className="mt-3 space-y-3 pt-3 border-t border-border/50">
                    <Field label="World Setting" value={proposal.advanced.worldSetting ?? "—"} />
                    <Field label="Series Direction" value={proposal.advanced.seriesDirection ?? "—"} />
                    <Field label="Comparable Titles" value={proposal.advanced.comparableTitles ?? "—"} />
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="materials" className="mt-0 focus-visible:outline-none">
                {proposal.materials.length === 0 &&
                proposal.manuscripts.length === 0 &&
                !proposal.sampleChapterUrl ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No materials uploaded yet.</p>
                ) : (
                  <MaterialsViewer proposal={proposal} />
                )}
              </TabsContent>

              <TabsContent value="audit" className="mt-0 focus-visible:outline-none">
                {history.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  <ol className="relative ml-2 space-y-4 border-l border-border/60 pl-4 text-xs">
                    {history.map((h) => (
                      <li key={h.id} className="relative">
                        <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-primary/80 ring-4 ring-background" />
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-semibold text-foreground">{h.type}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDateTime(h.createdAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-muted-foreground">
                          <span>by <strong className="text-foreground">{h.actorName}</strong></span>
                          {h.fromStatus ? (
                            <span>
                              {" "}• Status changed: <span className="font-medium text-foreground">{STATUS_LABEL[h.fromStatus]}</span> → <span className="font-medium text-foreground">{h.toStatus ? STATUS_LABEL[h.toStatus] : ""}</span>
                            </span>
                          ) : null}
                        </div>
                        {h.comment ? (
                          <div className="mt-2 rounded-xl border border-border/50 bg-background/60 p-3 text-xs italic text-foreground">
                            "{h.comment}"
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </section>

        {/* Right Column: Sticky Decision Workbench Sidebar */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          {/* Board Readiness Checklist */}
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

          {/* Editorial Decision Panel */}
          <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-xs backdrop-blur-md">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Editorial Decision</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Take formal editorial action on this proposal package.
              </p>
            </div>

            {isSelf && (
              <div className="mt-2">
                <SeparationOfDutiesWarning reason="SELF_APPROVAL_BLOCKED" />
              </div>
            )}
            {isUnclaimed && !isSelf && (
              <p className="mt-1 text-xs text-muted-foreground">
                You must claim this review before submitting an editorial decision.
              </p>
            )}
            {isClaimedByOther && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                <Lock className="size-4 shrink-0" />
                <span>Currently being reviewed by {proposal.claimedByEditorName}.</span>
              </div>
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

function ClaimStatusHeader({
  proposal,
  isUnclaimed,
  isClaimedByMe,
  isClaimedByOther,
  actionMutation,
}: {
  proposal: SeriesProposal;
  isUnclaimed: boolean;
  isClaimedByMe: boolean;
  isClaimedByOther: boolean;
  actionMutation: ReturnType<typeof useProposalActionMutation>;
}) {
  if (!EDITOR_REVIEW_STATUSES.includes(proposal.status)) return null;

  if (isUnclaimed) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 shadow-2xs dark:border-emerald-500/20 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <Unlock className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
              Awaiting Editor Claim
            </p>
            <p className="truncate text-[11px] text-emerald-700 dark:text-emerald-300">
              Claim this proposal to become the active reviewer and submit editorial decisions.
            </p>
          </div>
        </div>
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
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-50"
        >
          {actionMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="size-3.5" />
          )}
          Claim Review
        </button>
      </div>
    );
  }

  if (isClaimedByMe) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3.5 shadow-2xs dark:border-primary/20 dark:bg-primary/15">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">You are Reviewing this Proposal</p>
            <p className="truncate text-[11px] text-muted-foreground">
              Active review control enabled. {proposal.claimedAt ? `Claimed ${formatDateTime(proposal.claimedAt)}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={actionMutation.isPending}
          onClick={() =>
            actionMutation.mutate(
              { action: "RELEASE_CLAIM" },
              {
                onSuccess: () => toast.success("Review claim released."),
                onError: (err: unknown) =>
                  toast.error(
                    err instanceof Error ? err.message : "Unable to release the review claim.",
                  ),
              },
            )
          }
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border/80 bg-background/60 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-background disabled:opacity-50"
        >
          {actionMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Unlock className="size-3.5" />
          )}
          Release Claim
        </button>
      </div>
    );
  }

  if (isClaimedByOther) {
    return (
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 shadow-2xs dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-200">
        <Lock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <span className="font-semibold">Claimed by {proposal.claimedByEditorName}</span>
          <span className="ml-1 text-[11px] text-amber-700 dark:text-amber-300">
            — This proposal is locked by another editor. You can view materials but cannot make decisions.
          </span>
        </div>
      </div>
    );
  }

  return null;
}


function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs backdrop-blur-md space-y-4">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <div className="min-w-0 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/50 p-3.5 space-y-1">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
}

