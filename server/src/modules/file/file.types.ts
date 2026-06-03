import type { FileOwnerType } from "./file.model.js";

export interface FileAsset {
  id: string;
  ownerType: FileOwnerType;
  ownerId: string;
  originalUrl: string;
  aiProcessUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  versionNumber: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFileAssetInput {
  ownerType: FileOwnerType;
  ownerId: string;
  originalUrl: string;
  aiProcessUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  versionNumber?: number;
  uploadedBy: string;
}
