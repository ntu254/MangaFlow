import { asyncRoute, created, ok } from "../lib/http.js";
import type { AuthedRequest } from "../types.js";
import { parseBody } from "../validators/common.js";
import { createRateTableSchema, patchRateTableSchema } from "../validators/rate-table.schema.js";
import {
  createRateTableEntry,
  listActiveRates,
  listRateTable,
  patchRateTableEntry,
} from "../services/rate-table.service.js";

export const listAdminRates = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await listRateTable(req));
});

export const listActiveRateOptions = asyncRoute(async (_req: AuthedRequest, res) => {
  ok(res, await listActiveRates());
});

export const createAdminRate = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createRateTableSchema, req);
  created(res, await createRateTableEntry(req, body));
});

export const patchAdminRate = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchRateTableSchema, req);
  ok(res, await patchRateTableEntry(req, String(req.params.id), body));
});
