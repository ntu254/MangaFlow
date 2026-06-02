import { Router } from "express";
import { requireAuth, type AuthVerifier } from "../auth/auth.middleware.js";
import { createFileController } from "./file.controller.js";
import type { FileService } from "./file.service.js";

export type FileRouteDependencies = {
  authVerifier: AuthVerifier;
  fileService: FileService;
};

export function createFileRouter(dependencies: FileRouteDependencies) {
  const router = Router();
  const controller = createFileController(dependencies.fileService);
  const authenticate = requireAuth(dependencies.authVerifier);

  router.get("/:fileId", authenticate, (req, res) => controller.getFileMetadata(req, res));
  router.get("/:fileId/signed-url", authenticate, (req, res) => controller.getSignedUrl(req, res));
  router.delete("/:fileId", authenticate, (req, res) => controller.deleteFile(req, res));
  router.get("/owner/:ownerType/:ownerId", authenticate, (req, res) => controller.getFilesByOwner(req, res));

  return router;
}
