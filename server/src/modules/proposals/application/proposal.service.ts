import { AppError } from "../../../lib/http.js";
import { id, nowIso } from "../../../domain/ids.js";
import { apiToWebRole } from "../../../domain/roles.js";
import { audit } from "../../../services/audit.service.js";
import { applyProposalAction } from "../../../services/workflow.service.js";
import { requireActor, slugify } from "../../../controllers/helpers.js";
import { rejectProtectedFields } from "../../../validators/common.js";
import type { AuthedRequest, ProposalAction, ProposalStatus } from "../../../types.js";
import {
  canReadProposal,
  scopedProposalFilterForActor,
} from "../../../services/mvp-access.service.js";
import { PROPOSAL_STATUSES } from "../domain/proposal-status.js";
import {
  createProposalRecord,
  findProposalById,
  ProposalModel,
} from "../infrastructure/proposal.repository.js";

export function proposalListFilterForRequest(req: AuthedRequest) {
  const actor = requireActor(req);
  let filter: Record<string, unknown> = scopedProposalFilterForActor(actor);
  const rawStatus = req.query.status;
  const statuses = Array.isArray(rawStatus)
    ? rawStatus.flatMap((value) => String(value).split(","))
    : typeof rawStatus === "string"
      ? rawStatus.split(",")
      : [];
  const normalizedStatuses = statuses.map((status) => status.trim()).filter(Boolean);

  if (normalizedStatuses.length > 0) {
    const invalid = normalizedStatuses.find(
      (status) => !PROPOSAL_STATUSES.has(status as ProposalStatus),
    );
    if (invalid) {
      throw new AppError(400, `Invalid proposal status filter: ${invalid}`, "VALIDATION_ERROR");
    }
    const statusFilter =
      normalizedStatuses.length === 1 ? normalizedStatuses[0] : { $in: normalizedStatuses };
    filter = { $and: [filter, { status: statusFilter }] };
  }

  return filter;
}

export function proposalListModel() {
  return ProposalModel;
}

export async function createProposal(req: AuthedRequest, body: any) {
  const actor = requireActor(req);
  const now = nowIso();
  rejectProtectedFields(body as Record<string, unknown>);
  const proposalId = id("p");
  const slugBase = slugify(body.slug?.trim() || body.title || "proposal") || "proposal";
  const proposal = await createProposalRecord({
    id: proposalId,
    slug: `${slugBase}-${proposalId.slice(2)}`,
    title: body.title ?? "Untitled proposal",
    authorId: actor.id,
    authorName: actor.name,
    synopsis: body.synopsis ?? "",
    logline: body.logline,
    genres: Array.isArray(body.genres) ? body.genres : [],
    targetAudience: body.targetAudience ?? "seinen",
    requestedPublicationType: body.requestedPublicationType ?? "MONTHLY",
    chaptersPlanned: Number(body.chaptersPlanned ?? 12),
    coverUrl: body.coverUrl ?? "",
    coverFileKey: body.coverFileKey,
    sampleChapterUrl: body.sampleChapterUrl ?? "metadata://sample",
    status: "DRAFT",
    votes: [],
    history: [
      {
        id: id("pe"),
        proposalId: "pending",
        actorId: actor.id,
        actorName: actor.name,
        actorRole: apiToWebRole[actor.role],
        type: "CREATE",
        toStatus: "DRAFT",
        createdAt: now,
      },
    ],
    manuscripts: body.manuscripts ?? [],
    materials: body.materials ?? [],
    hook: body.hook,
    mainCharacters: body.mainCharacters,
    originalWorkConfirmed: body.originalWorkConfirmed,
    submissionNote: body.submissionNote,
    advanced: body.advanced,
    requestedChanges: [],
    revisionRound: 0,
    createdAt: now,
    updatedAt: now,
  });

  await audit(req, "proposal.create", "proposal", (proposal as any).id);
  return proposal;
}

export async function getProposal(req: AuthedRequest, proposalId: string) {
  const actor = requireActor(req);
  const proposal = await findProposalById(proposalId);
  if (!proposal || !canReadProposal(actor, proposal)) {
    throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
  }
  return proposal;
}

export async function patchProposal(req: AuthedRequest, proposalId: string, body: Record<string, unknown>) {
  rejectProtectedFields(body);
  await applyProposalAction(req, proposalId, "EDIT", body);
  return findProposalById(proposalId);
}

export async function withdrawProposal(req: AuthedRequest, proposalId: string, body: Record<string, unknown>) {
  await applyProposalAction(req, proposalId, "WITHDRAW", body);
  return { id: proposalId };
}

export function runProposalAction(
  req: AuthedRequest,
  proposalId: string,
  action: ProposalAction,
  body: Record<string, unknown>,
) {
  return applyProposalAction(req, proposalId, action, body);
}
