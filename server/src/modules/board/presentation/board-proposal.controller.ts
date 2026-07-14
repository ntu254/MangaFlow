import { asyncRoute, ok } from "../../../lib/http.js";
import {
  buildPagination,
  parseListQuery,
} from "../../../shared/contracts/list-contract.js";
import type { AuthedRequest } from "../../../types.js";
import {
  castBoardProposalVote,
  finalizeBoardProposal,
  getBoardProposalVotes,
  listBoardQueue as listBoardQueueQuery,
} from "../application/board-proposal.service.js";
import {
  boardProposalFinalizationSchema,
  boardProposalVoteSchema,
} from "./board-proposal.schemas.js";

const BOARD_QUEUE_LIST_CONFIG = {
  searchable: ["title", "authorName", "synopsis"] as const,
  sortable: ["title", "status", "updatedAt", "createdAt"] as const,
  filterable: {
    title: "text",
    status: "select",
    requestedPublicationType: "select",
    createdAt: "dateRange",
    updatedAt: "dateRange",
  } as const,
  defaultSort: { field: "updatedAt", dir: "desc" } as const,
  maxPageSize: 100,
};

export const listBoardQueue = asyncRoute(async (req: AuthedRequest, res) => {
  const query = parseListQuery(req, BOARD_QUEUE_LIST_CONFIG);
  const result = await listBoardQueueQuery(query);
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

export const castProposalVote = asyncRoute(async (req: AuthedRequest, res) => {
  const payload = boardProposalVoteSchema.parse(req.body);
  ok(
    res,
    await castBoardProposalVote(req, String(req.params.proposalId), payload),
  );
});

export const getProposalVotes = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await getBoardProposalVotes(String(req.params.proposalId)));
});

export const castProposalTieBreakVote = asyncRoute(
  async (req: AuthedRequest, res) => {
    const payload = boardProposalVoteSchema.parse(req.body);
    ok(
      res,
      await castBoardProposalVote(req, String(req.params.proposalId), payload),
    );
  },
);

export const finalizeProposal = asyncRoute(async (req: AuthedRequest, res) => {
  const payload = boardProposalFinalizationSchema.parse(req.body);
  ok(
    res,
    await finalizeBoardProposal(req, String(req.params.proposalId), payload),
  );
});
