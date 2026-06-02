import { storageService } from "../../infrastructure/storage/storage.service.js";
import type { FileRepository } from "./file.repository.js";
import type { FileAsset, CreateFileAssetInput } from "./file.types.js";
import type { FileOwnerType } from "./file.model.js";

export class FileServiceError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code: string = "BAD_REQUEST"
  ) {
    super(message);
    this.name = "FileServiceError";
  }
}

export function createFileService(repository: FileRepository) {
  return {
    async createFileAsset(data: CreateFileAssetInput): Promise<FileAsset> {
      return repository.createFileAsset(data);
    },

    async getById(fileId: string): Promise<FileAsset> {
      const fileAsset = await repository.findById(fileId);
      if (!fileAsset) {
        throw new FileServiceError("File asset not found", 404, "NOT_FOUND");
      }
      return fileAsset;
    },

    async getByOwner(ownerType: FileOwnerType, ownerId: string): Promise<FileAsset[]> {
      return repository.findByOwner(ownerType, ownerId);
    },

    async getLatestByOwner(ownerType: FileOwnerType, ownerId: string): Promise<FileAsset | null> {
      return repository.findLatestByOwner(ownerType, ownerId);
    },

    async deleteFileAsset(fileId: string): Promise<boolean> {
      const asset = await repository.findById(fileId);
      if (!asset) {
        throw new FileServiceError("File asset not found", 404, "NOT_FOUND");
      }

      // 1. Delete files from storage
      if (asset.originalUrl) {
        await storageService.deleteFile(asset.originalUrl);
      }
      if (asset.aiProcessUrl) {
        await storageService.deleteFile(asset.aiProcessUrl);
      }
      if (asset.previewUrl) {
        await storageService.deleteFile(asset.previewUrl);
      }
      if (asset.thumbnailUrl) {
        await storageService.deleteFile(asset.thumbnailUrl);
      }

      // 2. Delete metadata record from db
      return repository.deleteFileAsset(fileId);
    },

    /**
     * Replaces S3 keys with temporary signed URLs for client rendering.
     */
    async resolveSignedUrls(asset: FileAsset): Promise<FileAsset> {
      const resolved = { ...asset };
      if (resolved.originalUrl) {
        resolved.originalUrl = await storageService.getSignedUrl(resolved.originalUrl);
      }
      if (resolved.aiProcessUrl) {
        resolved.aiProcessUrl = await storageService.getSignedUrl(resolved.aiProcessUrl);
      }
      if (resolved.previewUrl) {
        resolved.previewUrl = await storageService.getSignedUrl(resolved.previewUrl);
      }
      if (resolved.thumbnailUrl) {
        resolved.thumbnailUrl = await storageService.getSignedUrl(resolved.thumbnailUrl);
      }
      return resolved;
    },

    /**
     * Resolves signed URLs for a list of FileAssets.
     */
    async resolveSignedUrlsList(assets: FileAsset[]): Promise<FileAsset[]> {
      return Promise.all(assets.map(asset => this.resolveSignedUrls(asset)));
    }
  };
}

export type FileService = ReturnType<typeof createFileService>;
