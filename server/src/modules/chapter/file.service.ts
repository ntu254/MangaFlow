import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Types } from "mongoose";
import { config } from "../../shared/utils/env.js";

const s3 = new S3Client({
  region: config.r2Region,
  endpoint: config.r2Endpoint,
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  },
});

export interface PresignedUploadResult {
  uploadUrl: string;
  fileAssetId: string;
  r2Key: string;
  expiresIn: number;
}

export interface PresignedDownloadResult {
  downloadUrl: string;
  expiresIn: number;
}

function buildR2Key(fileAssetId: string, originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
  return `uploads/${fileAssetId}.${ext}`;
}

function buildChapterImageR2Key(
  fileAssetId: string,
  originalName: string,
  seriesId: string,
  chapterId: string,
): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
  return `series/${seriesId}/chapters/${chapterId}/images/${fileAssetId}.${ext}`;
}

export async function createPresignedUploadUrl(
  originalName: string,
  contentType: string,
  expiresIn = 3600,
  customR2Key?: string,
  scope?: { seriesId: string; chapterId: string },
): Promise<PresignedUploadResult> {
  const fileAssetId = new Types.ObjectId().toString();
  const r2Key = customR2Key || (
    scope
      ? buildChapterImageR2Key(fileAssetId, originalName, scope.seriesId, scope.chapterId)
      : buildR2Key(fileAssetId, originalName)
  );

  const command = new PutObjectCommand({
    Bucket: config.r2Bucket,
    Key: r2Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });

  return {
    uploadUrl,
    fileAssetId,
    r2Key,
    expiresIn,
  };
}

export async function createPresignedDownloadUrl(
  r2Key: string,
  expiresIn = 3600,
): Promise<PresignedDownloadResult> {
  const command = new GetObjectCommand({
    Bucket: config.r2Bucket,
    Key: r2Key,
  });

  const downloadUrl = await getSignedUrl(s3, command, { expiresIn });

  return { downloadUrl, expiresIn };
}

export async function deleteFileAsset(r2Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.r2Bucket,
    Key: r2Key,
  });
  await s3.send(command);
}

export async function getFileBuffer(r2Key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: config.r2Bucket,
    Key: r2Key,
  });
  const response = await s3.send(command);
  if (!response.Body) {
    throw new Error("S3 object body is empty");
  }
  const arrayBuffer = await response.Body.transformToByteArray();
  return Buffer.from(arrayBuffer);
}

export async function uploadBuffer(
  buffer: Buffer,
  originalName: string,
  contentType: string,
): Promise<{ fileAssetId: string; r2Key: string; size: number }> {
  const fileAssetId = new Types.ObjectId().toString();
  const r2Key = buildR2Key(fileAssetId, originalName);
  const size = buffer.length;

  const command = new PutObjectCommand({
    Bucket: config.r2Bucket,
    Key: r2Key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);

  return { fileAssetId, r2Key, size };
}

export function validateFileType(
  mimeType: string,
  allowedTypes: string[],
): boolean {
  return allowedTypes.includes(mimeType);
}

export function validateFileSize(size: number, maxSizeMB: number): boolean {
  return size <= maxSizeMB * 1024 * 1024
}

export async function checkObjectExists(r2Key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.r2Bucket,
      Key: r2Key,
    });
    await s3.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error(`[S3 Error] checkObjectExists failed for ${r2Key}:`, error.message);
    if (!config.isProduction) {
      return true; // Bypass in local development to prevent 500 crashes
    }
    throw error;
  }
}
