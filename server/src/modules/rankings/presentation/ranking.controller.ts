import { asyncRoute, created, ok } from "../../../lib/http.js";
import { parseBody } from "../../../validators/common.js";
import type { AuthedRequest } from "../../../types.js";
import {
  importRankings as importRankingsCommand,
  listSeriesRankings as listSeriesRankingsQuery,
  rankingListFilter,
  rankingModel,
} from "../application/ranking.service.js";
import { rankingImportSchema } from "./ranking.schemas.js";
import {
  buildPagination,
  combineMongoFilters,
  listFiltersToMongo,
  listSearchToMongo,
  listSortToMongo,
  parseListQuery,
} from "../../../shared/contracts/list-contract.js";

const RANKING_LIST_CONFIG = {
  searchable: ["seriesTitle", "seriesId", "period", "status", "source"] as const,
  sortable: [
    "seriesTitle",
    "period",
    "readerScore",
    "voteCount",
    "finalScore",
    "status",
    "atRisk",
    "updatedAt",
    "createdAt",
    "importedAt",
  ] as const,
  filterable: {
    seriesId: "select",
    period: "select",
    status: "select",
    source: "select",
    atRisk: "boolean",
    readerScore: "numberRange",
    voteCount: "numberRange",
    finalScore: "numberRange",
    createdAt: "dateRange",
    updatedAt: "dateRange",
    importedAt: "dateRange",
  } as const,
  defaultSort: { field: "finalScore", dir: "desc" } as const,
  maxPageSize: 100,
};

function summarizeRankings(rankings: any[]) {
  const atRisk = rankings.filter((ranking) => ranking.atRisk || ranking.status === "AT_RISK").length;
  const byStatus = rankings.reduce<Record<string, number>>((acc, ranking) => {
    const status = String(ranking.status ?? "UNKNOWN");
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: rankings.length,
    atRisk,
    byStatus,
  };
}

export const listRankings = asyncRoute(async (req: AuthedRequest, res) => {
  const query = parseListQuery(req, RANKING_LIST_CONFIG);
  const filter = combineMongoFilters(
    await rankingListFilter(req),
    listSearchToMongo(query.q, RANKING_LIST_CONFIG.searchable),
    listFiltersToMongo(query.filters),
  );
  const sort = Object.keys(listSortToMongo(query.sort)).length
    ? listSortToMongo(query.sort)
    : { finalScore: -1 as const };
  const [rankings, total] = await Promise.all([
    rankingModel()
      .find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    rankingModel().countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: rankings,
    pagination: buildPagination(query, total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: query.filters,
      summary: summarizeRankings(rankings),
    },
  });
});

export const listSeriesRankings = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await listSeriesRankingsQuery(req, String(req.params.seriesId)));
});

export const importRankings = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(rankingImportSchema, req);
  created(res, await importRankingsCommand(req, body));
});
