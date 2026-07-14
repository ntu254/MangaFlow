import { asyncRoute, created, ok } from "../../../lib/http.js";
import { paginated } from "../../../controllers/helpers.js";
import { parseBody } from "../../../validators/common.js";
import type { AuthedRequest } from "../../../types.js";
import {
  importRankings as importRankingsCommand,
  listSeriesRankings as listSeriesRankingsQuery,
  rankingListFilter,
  rankingModel,
} from "../application/ranking.service.js";
import { rankingImportSchema } from "./ranking.schemas.js";

export const listRankings = asyncRoute(async (req: AuthedRequest, res) => {
  await paginated(req, res, rankingModel(), await rankingListFilter(req), { finalScore: -1 });
});

export const listSeriesRankings = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await listSeriesRankingsQuery(req, String(req.params.seriesId)));
});

export const importRankings = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(rankingImportSchema, req);
  created(res, await importRankingsCommand(req, body));
});
