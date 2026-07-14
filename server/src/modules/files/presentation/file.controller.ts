import { asyncRoute, ok } from "../../../lib/http.js";
import { requireActor } from "../../../controllers/helpers.js";
import type { AuthedRequest } from "../../../types.js";
import {
  createPresignedDownload,
  createPresignedUpload,
  createSignedDisplayUrl,
} from "../application/file-access.application.js";

export const presignUpload = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await createPresignedUpload(req.body ?? {}));
});

export const presignDownload = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await createPresignedDownload(requireActor(req), req.body.key));
});

export const displayUrl = asyncRoute(async (req: AuthedRequest, res) => {
  ok(
    res,
    await createSignedDisplayUrl({
      actor: requireActor(req),
      key: req.body.key,
      fileName: req.body.fileName,
    }),
  );
});
