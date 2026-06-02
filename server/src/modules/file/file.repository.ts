import mongoose from "mongoose";
import { FileAssetModel, type FileAssetDocument, type FileOwnerType } from "./file.model.js";
import type { FileAsset, CreateFileAssetInput } from "./file.types.js";

function serializeFileAsset(document: FileAssetDocument & { _id: unknown }): FileAsset {
  return {
    id: String(document._id),
    ownerType: document.ownerType,
    ownerId: String(document.ownerId),
    originalUrl: document.originalUrl,
    aiProcessUrl: document.aiProcessUrl,
    previewUrl: document.previewUrl,
    thumbnailUrl: document.thumbnailUrl,
    fileName: document.fileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    width: document.width,
    height: document.height,
    versionNumber: document.versionNumber,
    uploadedBy: String(document.uploadedBy),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function createMongoFileRepository() {
  return {
    async createFileAsset(data: CreateFileAssetInput): Promise<FileAsset> {
      const fileAsset = await FileAssetModel.create({
        ownerType: data.ownerType,
        ownerId: new mongoose.Types.ObjectId(data.ownerId),
        originalUrl: data.originalUrl,
        aiProcessUrl: data.aiProcessUrl,
        previewUrl: data.previewUrl,
        thumbnailUrl: data.thumbnailUrl,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        versionNumber: data.versionNumber ?? 1,
        uploadedBy: new mongoose.Types.ObjectId(data.uploadedBy)
      });
      return serializeFileAsset(fileAsset);
    },

    async findById(fileId: string): Promise<FileAsset | null> {
      if (!mongoose.isValidObjectId(fileId)) return null;
      const fileAsset = await FileAssetModel.findById(fileId);
      return fileAsset ? serializeFileAsset(fileAsset) : null;
    },

    async findByOwner(ownerType: FileOwnerType, ownerId: string): Promise<FileAsset[]> {
      if (!mongoose.isValidObjectId(ownerId)) return [];
      const fileAssets = await FileAssetModel.find({
        ownerType,
        ownerId: new mongoose.Types.ObjectId(ownerId)
      }).sort({ versionNumber: -1 });
      return fileAssets.map(serializeFileAsset);
    },

    async findLatestByOwner(ownerType: FileOwnerType, ownerId: string): Promise<FileAsset | null> {
      if (!mongoose.isValidObjectId(ownerId)) return null;
      const latest = await FileAssetModel.findOne({
        ownerType,
        ownerId: new mongoose.Types.ObjectId(ownerId)
      }).sort({ versionNumber: -1 });
      return latest ? serializeFileAsset(latest) : null;
    },

    async deleteFileAsset(fileId: string): Promise<boolean> {
      if (!mongoose.isValidObjectId(fileId)) return false;
      const res = await FileAssetModel.deleteOne({ _id: fileId });
      return res.deletedCount > 0;
    }
  };
}

export type FileRepository = ReturnType<typeof createMongoFileRepository>;
