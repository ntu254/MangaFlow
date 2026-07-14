import { asyncRoute, created, ok } from "../../../lib/http.js";
import {
  buildPagination,
  parseListQuery,
} from "../../../shared/contracts/list-contract.js";
import { validateAction } from "../../../controllers/helpers.js";
import { parseBody } from "../../../validators/common.js";
import { createProposalSchema, patchProposalSchema } from "../../../validators/proposal.schema.js";
import type { AuthedRequest } from "../../../types.js";
import { PROPOSAL_ACTIONS } from "../../../types.js";
import {
  createProposal as createProposalCommand,
  getProposal as getProposalQuery,
  listProposals as listProposalsQuery,
  patchProposal as patchProposalCommand,
  runProposalAction,
  withdrawProposal,
} from "../application/proposal.service.js";

const PROPOSAL_LIST_CONFIG = {
  searchable: ["title", "authorName", "synopsis", "logline"] as const,
  sortable: ["title", "authorName", "status", "updatedAt", "createdAt"] as const,
  filterable: {
    title: "text",
    authorName: "text",
    status: "select",
    authorId: "select",
    assignedEditorId: "select",
    claimedByEditorId: "select",
    requestedPublicationType: "select",
    createdAt: "dateRange",
    updatedAt: "dateRange",
  } as const,
  defaultSort: { field: "updatedAt", dir: "desc" } as const,
  maxPageSize: 100,
};

export const listProposals = asyncRoute(async (req: AuthedRequest, res) => {
  const query = parseListQuery(req, PROPOSAL_LIST_CONFIG);
  const result = await listProposalsQuery(req, query);
  return res.json({
    success: true,
    data: result.data,
    pagination: buildPagination(query, result.total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: query.filters,
      summary: result.summary,
    },
  });
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
