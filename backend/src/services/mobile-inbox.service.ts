import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";
import {
  mobileInboxSchema,
  type MobileInbox,
  type MobileWorkItem,
  type MobileWorkflowActionDescriptor,
} from "../mobile/mobile-work-item.contract.js";
import { editorReviewQueue, boardQueue } from "./workflow.service.js";

// Foundation slice: Editor Today shows proposal review work; Board Today shows
// vote work. Later plans extend these projections with chapter/comment/publication
// and finalize/re-vote/at-risk items. Capabilities are derived here from the
// canonical queue data — mobile never recomputes eligibility.

type ActionInput = Omit<MobileWorkflowActionDescriptor, "disabledReason"> & {
  disabledReason?: string | null;
};

function action(input: ActionInput): MobileWorkflowActionDescriptor {
  return {
    action: input.action,
    enabled: input.enabled,
    // Contract invariant: enabled => null reason; disabled => non-empty reason.
    disabledReason: input.enabled ? null : (input.disabledReason ?? "Not available."),
    requiresConfirmation: input.requiresConfirmation,
    requiresReason: input.requiresReason,
  };
}

function proposalWorkItem(actor: RequestActor, proposal: any): MobileWorkItem {
  const claimedByOther =
    proposal.claimedByEditorId != null && proposal.claimedByEditorId !== actor.id;
  const claimedByMe = proposal.claimedByEditorId === actor.id;
  const claimedReason = claimedByOther
    ? `Claimed by ${proposal.claimedByEditorName ?? "another editor"}.`
    : "Claim this proposal first.";
  const seriesStatus = String(proposal.series?.status ?? "");
  const isRevision = seriesStatus === "REVISION_REQUESTED";

  return {
    id: `PROPOSAL_REVIEW:${proposal.id}`,
    kind: "PROPOSAL_REVIEW",
    entityType: "PROPOSAL",
    entityId: String(proposal.id),
    status: seriesStatus || "EDITOR_REVIEW",
    version: proposal.manuscript?.version ?? null,
    title: String(proposal.series?.title ?? proposal.id),
    subtitle: `Manuscript v${proposal.manuscript?.version ?? 1}`,
    priority: {
      level: proposal.priority === "high" ? "HIGH" : "NORMAL",
      reason: isRevision
        ? "Revision received"
        : proposal.claimStatus === "AVAILABLE"
          ? "Awaiting editor claim"
          : "In your review",
      dueAt: null,
    },
    blockers: [],
    actions: [
      action({
        action: "CLAIM",
        enabled: !claimedByMe && !claimedByOther,
        disabledReason: claimedByMe ? "You already claimed this proposal." : claimedReason,
        requiresConfirmation: true,
        requiresReason: false,
      }),
      action({
        action: "REQUEST_CHANGES",
        enabled: claimedByMe,
        disabledReason: claimedReason,
        requiresConfirmation: true,
        requiresReason: true,
      }),
      action({
        action: "REJECT",
        enabled: claimedByMe,
        disabledReason: claimedReason,
        requiresConfirmation: true,
        requiresReason: true,
      }),
      action({
        action: "FORWARD",
        enabled: claimedByMe,
        disabledReason: claimedReason,
        requiresConfirmation: true,
        requiresReason: false,
      }),
    ],
    summary: {
      claimStatus: proposal.claimStatus,
      requestedPublicationType: proposal.series?.requestedPublicationType ?? null,
    },
  };
}

function isProposalVoteItem(item: any): boolean {
  return item.seriesStatus !== "AT_RISK" && item.voteSummary != null;
}

function boardVoteWorkItem(_actor: RequestActor, item: any): MobileWorkItem {
  const hasOpenSession = item.votingSessionId != null;
  const summary = item.voteSummary ?? {};
  return {
    id: `BOARD_VOTE:${item.id}`,
    kind: "BOARD_VOTE",
    entityType: "VOTING_SESSION",
    entityId: String(item.votingSessionId ?? item.seriesId ?? item.id),
    status: String(item.decisionStatus ?? "PENDING"),
    version: item.expectedVersion ?? null,
    title: String(item.seriesTitle ?? item.title ?? item.id),
    subtitle: `Approve ${summary.approve ?? 0} · Reject ${summary.reject ?? 0} of ${summary.eligible ?? item.eligibleBoardCount ?? 0}`,
    priority: {
      level: item.decisionStatus === "TIE_BREAK_REQUIRED" ? "URGENT" : "HIGH",
      reason:
        item.decisionStatus === "TIE_BREAK_REQUIRED"
          ? "Tie awaiting re-vote"
          : "Board vote pending",
      dueAt: null,
    },
    blockers: [],
    actions: [
      action({
        action: "VOTE",
        enabled: hasOpenSession,
        disabledReason: hasOpenSession ? null : "Voting is not open for this proposal.",
        requiresConfirmation: true,
        requiresReason: false,
      }),
    ],
    summary: {
      quorum: summary.quorum ?? item.quorum ?? null,
      eligible: summary.eligible ?? item.eligibleBoardCount ?? null,
    },
  };
}

export async function getEditorMobileInbox(actor: RequestActor): Promise<MobileInbox> {
  if (actor.role !== "EDITOR") {
    throw new AppError(403, "Editor permission is required.", "FORBIDDEN");
  }
  const proposals = await editorReviewQueue();
  return mobileInboxSchema.parse({
    role: "EDITOR",
    generatedAt: new Date().toISOString(),
    items: proposals.map((proposal) => proposalWorkItem(actor, proposal)),
  });
}

export async function getBoardMobileInbox(actor: RequestActor): Promise<MobileInbox> {
  if (actor.role !== "BOARD") {
    throw new AppError(403, "Board permission is required.", "FORBIDDEN");
  }
  const items = await boardQueue();
  return mobileInboxSchema.parse({
    role: "BOARD",
    generatedAt: new Date().toISOString(),
    items: items.filter(isProposalVoteItem).map((item) => boardVoteWorkItem(actor, item)),
  });
}
