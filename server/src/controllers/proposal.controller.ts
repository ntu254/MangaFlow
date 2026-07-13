import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import { ProposalModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { apiToWebRole } from "../domain/roles.js";
import { audit } from "../services/audit.service.js";
import { applyProposalAction } from "../services/workflow.service.js";
import { paginated, requireActor, slugify, validateAction } from "./helpers.js";
import { parseBody, rejectProtectedFields } from "../validators/common.js";
import { createProposalSchema, patchProposalSchema } from "../validators/proposal.schema.js";
import type { AuthedRequest, ProposalAction, ProposalStatus } from "../types.js";
import { PROPOSAL_ACTIONS } from "../types.js";

const PROPOSAL_STATUSES = new Set<ProposalStatus>([
  "DRAFT",
  "SUBMITTED",
  "PENDING_EDITOR",
  "EDITOR_REVIEWING",
  "CHANGES_REQUESTED",
  "RESUBMITTED",
  "PENDING_BOARD",
  "BOARD_VOTING",
  "TIE_BREAK",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
  "ARCHIVED",
]);

export const listProposals = asyncRoute(async (req: AuthedRequest, res) => {
  const filter: Record<string, unknown> = {};
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
    filter.status =
      normalizedStatuses.length === 1 ? normalizedStatuses[0] : { $in: normalizedStatuses };
  }

  await paginated(req, res, ProposalModel, filter, { updatedAt: -1 });
});

export const createProposal = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const now = nowIso();
  const body = parseBody(createProposalSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  const proposalId = id("p");
  const slugBase = slugify(body.slug?.trim() || body.title || "proposal") || "proposal";
  const proposal = await ProposalModel.create({
    id: proposalId,
    // Proposal slugs are identifiers, not title-only labels. Including the
    // generated id prevents duplicate titles and empty client slugs from
    // surfacing as Mongo duplicate-key 500 responses.
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
  created(res, proposal);
});

export const getProposal = asyncRoute(async (req: AuthedRequest, res) => {
  const proposal = await ProposalModel.findOne({ id: String(req.params.id) }).lean();
  if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
  ok(res, proposal);
});

export const patchProposal = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchProposalSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  await applyProposalAction(req, String(req.params.id), "EDIT", body);
  ok(res, await ProposalModel.findOne({ id: String(req.params.id) }).lean());
});

export const deleteProposal = asyncRoute(async (req: AuthedRequest, res) => {
  await applyProposalAction(req, String(req.params.id), "WITHDRAW", req.body);
  ok(res, { id: String(req.params.id) });
});

export const proposalAction = asyncRoute(async (req: AuthedRequest, res) => {
  const action = validateAction(String(req.params.action), PROPOSAL_ACTIONS);
  ok(res, await applyProposalAction(req, String(req.params.id), action, req.body));
});
