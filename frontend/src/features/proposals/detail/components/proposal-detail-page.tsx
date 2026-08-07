import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import {
  useProposalQuery,
  useUpdateProposalMutation,
  useProposalActionMutation,
} from "@/features/proposals";
import { ProposalStatusPill } from "@/entities/proposal";
import { StatusFlow } from "@/entities/proposal";
import { VoteTally } from "@/entities/proposal";
import { ActionPanel } from "./action-panel";
import { ProposalWizard } from "../../create/components/proposal-wizard";
import { EmptyState } from "@/shared/ui/empty-state";
import { AUDIENCE_LABEL } from "@/entities/proposal/model/proposal-types";
import { MaterialsViewer } from "@/entities/proposal";
import { RevisionChecklist } from "./revision-checklist";
import { ProposalVersionHistory } from "./proposal-version-history";
import { DecisionHistory } from "@/entities/proposal";
import { Timeline } from "./timeline";
import { ResolvedImage } from "@/shared/ui";
import { ResolvedFileLink } from "@/shared/ui/resolved-file-link";

type Tab = "overview" | "materials" | "revision" | "decision" | "versions";

const TABS: { id: Tab; label: string; badge?: number }[] = [
  { id: "overview", label: "Overview" },
  { id: "materials", label: "Materials" },
  { id: "revision", label: "Revision" },
  { id: "versions", label: "Submission versions" },
  { id: "decision", label: "Decision history" },
];

export function ProposalDetailPage({
  proposalId,
  editing = false,
}: {
  proposalId: string;
  editing?: boolean;
}) {
  const user = useAuth((s) => s.user);
  const { data: proposal, isLoading } = useProposalQuery(proposalId);
  const updateProposalMutation = useUpdateProposalMutation(proposalId);
  const proposalActionMutation = useProposalActionMutation(proposalId);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <EmptyState
        title="Proposal not found"
        description="The proposal may have been deleted or the ID is invalid."
        action={
          <Link to="/app/proposals" className="text-xs underline">
            Back to list
          </Link>
        }
      />
    );
  }

  const canEdit =
    user.role === "mangaka" &&
    proposal.authorId === user.id &&
    ["DRAFT", "CHANGES_REQUESTED"].includes(proposal.status);

  const isResubmission = proposal.status === "CHANGES_REQUESTED";
  const openChange = isResubmission
    ? ([...proposal.requestedChanges].reverse().find((change) => !change.resolvedAt) ?? null)
    : null;

  if (editing && canEdit) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          onClick={() => {
            navigate({ to: "/app/proposals/$proposalId", params: { proposalId }, search: {} });
          }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" /> Cancel editing
        </button>
        <header className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              {isResubmission ? "Edit & Resubmit Proposal" : "Edit Proposal"}
            </h1>
            <ProposalStatusPill status={proposal.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {isResubmission
              ? "Resolve the Editor's checklist, update your draft, and send it back for review."
              : "Update your manga series draft details before sending to editor review."}
          </p>
        </header>
        <ProposalWizard
          mode="edit"
          initialProposal={proposal}
          resubmit={isResubmission ? { change: openChange } : undefined}
          submitLabel={isResubmission ? "Save & Resubmit" : "Save changes"}
          onCancel={() =>
            navigate({ to: "/app/proposals/$proposalId", params: { proposalId }, search: {} })
          }
          onSave={async (payload, meta) => {
            try {
              if (isResubmission) {
                await proposalActionMutation.mutateAsync({
                  action: "RESUBMIT",
                  payload: {
                    ...payload,
                    resolvedItems: meta?.resolvedItems ?? {},
                    comment: meta?.comment,
                  },
                });
                toast.success("Changes saved and resubmitted to Editor.");
              } else {
                await updateProposalMutation.mutateAsync(payload);
                toast.success("Changes saved successfully.");
              }
              navigate({ to: "/app/proposals/$proposalId", params: { proposalId }, search: {} });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Error saving changes.");
              throw error;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/proposals"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Back to Proposals
      </Link>

      {editing && !canEdit ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-900 dark:text-amber-200">
          This proposal cannot be edited with the current account or status.
        </div>
      ) : null}

      {/* Single Vertical Column Flow */}
      <div className="space-y-6">
        {/* Unified Top Hero Card — Cover + Header + Metadata */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Left Cover Image */}
            <div className="w-36 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted shadow-2xs">
              <ResolvedImage
                fileKey={proposal.coverFileKey}
                fallbackUrl={proposal.coverUrl}
                alt={proposal.title}
                className="aspect-[2/3] w-full object-cover"
              />
            </div>

            {/* Right Details: Title, Badge, Synopsis & Metadata Grid */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Series Proposal · ID {proposal.id}
                  </span>
                  <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">
                    {proposal.title}
                  </h1>
                </div>
                <ProposalStatusPill status={proposal.status} size="lg" />
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground font-normal">
                {proposal.synopsis}
              </p>

              {/* Grid Metadata Row */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-border/60 sm:grid-cols-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Author
                  </span>
                  <span className="font-semibold text-foreground">{proposal.authorName}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Audience
                  </span>
                  <span className="font-semibold text-foreground">
                    {AUDIENCE_LABEL[proposal.targetAudience]}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Target Chapters
                  </span>
                  <span className="font-semibold text-foreground">
                    {proposal.chaptersPlanned} Chapters
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Genres
                  </span>
                  <span className="font-semibold text-foreground">
                    {proposal.genres.join(", ") || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Assigned Editor
                  </span>
                  <span className="font-semibold text-foreground">
                    {proposal.assignedEditorName ?? "Unassigned"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Revision Round
                  </span>
                  <span className="font-semibold text-foreground">
                    Round {proposal.revisionRound ?? 0}
                    {proposal.currentVersionId ? ` · v${proposal.currentVersionId}` : ""}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Sample Chapter File
                  </span>
                  <ResolvedFileLink
                    fileKey={proposal.manuscripts.at(-1)?.fileKey}
                    fallbackUrl={proposal.sampleChapterUrl}
                    fileName={proposal.manuscripts.at(-1)?.fileName}
                    className="font-semibold text-primary hover:underline"
                  >
                    View Sample Chapter
                  </ResolvedFileLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Status Pipeline */}
        <StatusFlow status={proposal.status} />

        {/* Workflow Action Panel */}
        <ActionPanel proposal={proposal} user={user} />

        {/* SaaS Tabs Header & Content */}
        <div className="space-y-4">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-6 text-sm font-medium">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                    tab === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {typeof t.badge === "number" && t.badge > 0 ? (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                      {t.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content Panels */}
          {tab === "overview" ? (
            <div className="space-y-6">
              {proposal.status === "PENDING_BOARD" ||
              proposal.status === "APPROVED" ||
              proposal.status === "REJECTED" ? (
                <VoteTally votes={proposal.votes} status={proposal.status} />
              ) : null}
              <section className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
                <h3 className="mb-3 text-xs font-bold text-foreground">
                  Workflow Timeline & Activity
                </h3>
                <Timeline events={proposal.history} />
              </section>
            </div>
          ) : tab === "materials" ? (
            <MaterialsViewer proposal={proposal} />
          ) : tab === "revision" ? (
            <RevisionChecklist proposal={proposal} />
          ) : tab === "versions" ? (
            <ProposalVersionHistory proposalId={proposalId} />
          ) : (
            <DecisionHistory proposal={proposal} />
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-xs text-foreground">{value}</span>
    </div>
  );
}
