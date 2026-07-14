import { asyncRoute, created, ok } from "../../../lib/http.js";
import { paginated, validateAction } from "../../../controllers/helpers.js";
import { parseBody } from "../../../validators/common.js";
import { createProposalSchema, patchProposalSchema } from "../../../validators/proposal.schema.js";
import type { AuthedRequest } from "../../../types.js";
import { PROPOSAL_ACTIONS } from "../../../types.js";
import {
  createProposal as createProposalCommand,
  getProposal as getProposalQuery,
  patchProposal as patchProposalCommand,
  proposalListFilterForRequest,
  proposalListModel,
  runProposalAction,
  withdrawProposal,
} from "../application/proposal.service.js";

export const listProposals = asyncRoute(async (req: AuthedRequest, res) => {
  await paginated(req, res, proposalListModel(), proposalListFilterForRequest(req), { updatedAt: -1 });
});

export const createProposal = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createProposalSchema, req);
  created(res, await createProposalCommand(req, body));
});

export const getProposal = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await getProposalQuery(req, String(req.params.id)));
});

export const patchProposal = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchProposalSchema, req);
  ok(res, await patchProposalCommand(req, String(req.params.id), body));
});

export const deleteProposal = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await withdrawProposal(req, String(req.params.id), req.body));
});

export const proposalAction = asyncRoute(async (req: AuthedRequest, res) => {
  const action = validateAction(String(req.params.action), PROPOSAL_ACTIONS);
  ok(res, await runProposalAction(req, String(req.params.id), action, req.body));
});
