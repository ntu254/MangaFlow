import type { Request, Response } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { FileServiceError, type FileService } from "./file.service.js";
import type { FileOwnerType } from "./file.model.js";

export function createFileController(service: FileService) {
  return {
    async getFileMetadata(req: Request, res: Response) {
      try {
        const fileId = req.params.fileId as string;
        const fileAsset = await service.getById(fileId);
        const resolved = await service.resolveSignedUrls(fileAsset);
        res.json(ok(resolved));
      } catch (error) {
        if (error instanceof FileServiceError) {
          res.status(error.statusCode).json(fail(error.message, error.code));
          return;
        }
        res.status(500).json(fail("Internal server error", "INTERNAL_ERROR"));
      }
    },

    async getSignedUrl(req: Request, res: Response) {
      try {
        const fileId = req.params.fileId as string;
        const fileAsset = await service.getById(fileId);
        const resolved = await service.resolveSignedUrls(fileAsset);
        res.json(
          ok({
            url: resolved.originalUrl,
            expiresIn: 900
          })
        );
      } catch (error) {
        if (error instanceof FileServiceError) {
          res.status(error.statusCode).json(fail(error.message, error.code));
          return;
        }
        res.status(500).json(fail("Internal server error", "INTERNAL_ERROR"));
      }
    },

    async deleteFile(req: Request, res: Response) {
      try {
        const fileId = req.params.fileId as string;
        const deleted = await service.deleteFileAsset(fileId);
        res.json(ok({ deleted }));
      } catch (error) {
        if (error instanceof FileServiceError) {
          res.status(error.statusCode).json(fail(error.message, error.code));
          return;
        }
        res.status(500).json(fail("Internal server error", "INTERNAL_ERROR"));
      }
    },

    async getFilesByOwner(req: Request, res: Response) {
      try {
        const ownerType = req.params.ownerType as string;
        const ownerId = req.params.ownerId as string;
        const assets = await service.getByOwner(ownerType as FileOwnerType, ownerId);
        const resolvedAssets = await service.resolveSignedUrlsList(assets);
        res.json(ok(resolvedAssets));
      } catch (error) {
        res.status(500).json(fail("Internal server error", "INTERNAL_ERROR"));
      }
    }
  };
}
