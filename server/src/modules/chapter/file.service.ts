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

const ENV = process.env.NODE_ENV === "production" ? "prod" : "dev";
const TENANT = "tenant_main";
const BASE_PATH = `${ENV}/${TENANT}`;

export const pathBuilder = {
  // Series-level assets
  seriesCover: (seriesId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/series-assets/cover/v${version}/${filename}`,
    
  seriesManuscript: (seriesId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/series-assets/manuscript/v${version}/${filename}`,

  // Chapter-level assets
  chapterCover: (seriesId: string, chapterId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/chapter-assets/cover/v${version}/${filename}`,

  chapterManuscript: (seriesId: string, chapterId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/chapter-assets/manuscript/v${version}/${filename}`,

  // Page-level assets
  pageOriginal: (seriesId: string, chapterId: string, pageId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/pages/${pageId}/original/v${version}/${filename}`,

  pageWorking: (seriesId: string, chapterId: string, pageId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/pages/${pageId}/working/v${version}/${filename}`,

  pageThumbnail: (seriesId: string, chapterId: string, pageId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/pages/${pageId}/thumbnail/v${version}/${filename}`,

  pageAiSegmentation: (seriesId: string, chapterId: string, pageId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/pages/${pageId}/ai/segmentation/v${version}/${filename}`,

  pageAiMask: (seriesId: string, chapterId: string, pageId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/pages/${pageId}/ai/mask/v${version}/${filename}`,

  pageTaskSubmission: (seriesId: string, chapterId: string, pageId: string, taskId: string, submissionId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/pages/${pageId}/tasks/${taskId}/submissions/${submissionId}/v${version}/${filename}`,

  pageFinal: (seriesId: string, chapterId: string, pageId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/pages/${pageId}/final/v${version}/${filename}`,

  // Exports
  exportPreview: (seriesId: string, chapterId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/exports/preview/v${version}/${filename}`,

  exportFinal: (seriesId: string, chapterId: string, version: number, filename: string) => 
    `${BASE_PATH}/series/${seriesId}/chapters/${chapterId}/exports/final/v${version}/${filename}`,
};

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "bin";
}

export async function createPresignedUploadUrl(
  originalName: string,
  contentType: string,
  expiresIn = 3600,
  customR2Key?: string,
  scope?: { seriesId: string; chapterId: string },
): Promise<PresignedUploadResult> {
  const r2Key = customR2Key;

  if (!r2Key) {
    throw new Error("r2Key is required for createPresignedUploadUrl. Please generate it using pathBuilder.");
  }

  const fileAssetId = new Types.ObjectId().toString();

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

export async function getFileStream(r2Key: string) {
  const command = new GetObjectCommand({
    Bucket: config.r2Bucket,
    Key: r2Key,
  });
  
  const response = await s3.send(command);
  return {
    stream: response.Body,
    contentType: response.ContentType || "application/octet-stream",
    contentLength: response.ContentLength
  };
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
  r2Key: string,
): Promise<{ fileAssetId: string; r2Key: string; size: number }> {
  const fileAssetId = new Types.ObjectId().toString();
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
