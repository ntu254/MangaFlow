import { AppError } from "../../../shared/errors/AppError.js";
import {
  confirmPageUploadRepository,
  getFileAssetById,
  getPageWithFileAsset,
  markPageProcessingFailed,
} from "../chapter.repository.js";
import {
  createPresignedDownloadUrl,
  createPresignedUploadUrl,
  getFileBuffer,
  checkObjectExists,
  validateFileSize,
  validateFileType,
} from "../file.service.js";
import {
  assertCanReadFileAsset,
  assertCanReadPage,
  assertCanWriteChapter,
  assertCanWritePage,
  type AccessActor,
} from "../../../shared/policies/accessPolicy.service.js";
import { Chapter, FileAsset, Page } from "../chapter.model.js";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export interface GetPresignedUploadUrlInput {
  originalName: string;
  contentType: string;
  expiresIn?: number;
  chapterId?: string;
  pageId?: string;
  actor: AccessActor;
}

export async function getPresignedUploadUrlService(
  input: GetPresignedUploadUrlInput,
) {
  if (!input.originalName?.trim())
    throw new AppError("Original file name is required", 400);
  if (!input.contentType?.trim())
    throw new AppError("Content type is required", 400);
  if (!validateFileType(input.contentType, ALLOWED_TYPES)) {
    throw new AppError(
      "File type not allowed. Use JPEG, PNG, WebP, or PDF",
      400,
    );
  }

  const chapterId = input.chapterId?.trim();
  if (!chapterId) {
    throw new AppError(
      "Chapter ID is required for generating a standard path",
      400,
    );
  }

  await assertCanWriteChapter(input.actor, chapterId);
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) throw new AppError("Chapter not found", 404);

  const pageId = input.pageId?.trim();
  if (!pageId) {
    throw new AppError(
      "Page ID is required for generating a standard path",
      400,
    );
  }

  const ext = input.originalName.split(".").pop()?.toLowerCase() || "bin";
  const filename = `upload-${Date.now()}.${ext}`;

  const customR2Key = (
    await import("../file.service.js")
  ).pathBuilder.pageOriginal(
    String(chapter.seriesId),
    chapterId,
    pageId,
    1,
    filename,
  );

  return createPresignedUploadUrl(
    input.originalName,
    input.contentType,
    input.expiresIn,
    customR2Key,
  );
}

export interface UploadAssetInput {
  fileAssetId: string;
  r2Key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ConfirmPageUploadInput {
  pageId: string;
  original: UploadAssetInput;
  working: UploadAssetInput;
  thumbnail: UploadAssetInput;
  userId: string;
  actor: AccessActor;
}

function assertAsset(asset: UploadAssetInput | undefined, label: string) {
  if (!asset) throw new AppError(`${label} file asset is required`, 400);
  if (
    !asset.fileAssetId?.trim() ||
    !asset.r2Key?.trim() ||
    !asset.originalName?.trim() ||
    !asset.mimeType?.trim()
  ) {
    throw new AppError(`All ${label} file asset fields are required`, 400);
  }
  if (!validateFileType(asset.mimeType, ALLOWED_TYPES)) {
    throw new AppError(`${label} file type not allowed`, 400);
  }
  if (!validateFileSize(asset.size, 100))
    throw new AppError(`${label} file size exceeds 100MB limit`, 400);
}

async function assertUploadedObjectExists(
  asset: UploadAssetInput,
  label: string,
) {
  const exists = await checkObjectExists(asset.r2Key);
  if (!exists) {
    throw new AppError(
      `${label} file was not uploaded to storage. Please retry upload.`,
      400,
    );
  }
}

type StorageErrorLike = {
  name?: string;
  message?: string;
  $metadata?: {
    httpStatusCode?: number;
  };
};

function isMissingStorageObject(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const storageError = error as StorageErrorLike;
  return (
    storageError.name === "NoSuchKey" ||
    storageError.name === "NotFound" ||
    storageError.$metadata?.httpStatusCode === 404 ||
    storageError.message
      ?.toLowerCase()
      .includes("specified key does not exist") === true
  );
}

export async function confirmPageUploadService(input: ConfirmPageUploadInput) {
  const trimmedPageId = input.pageId.trim();
  if (!trimmedPageId) throw new AppError("Page id is required", 400);
  await assertCanWritePage(input.actor, trimmedPageId);

  assertAsset(input.original, "Original");
  assertAsset(input.working, "Working");
  assertAsset(input.thumbnail, "Thumbnail");

  try {
    await Promise.all([
      assertUploadedObjectExists(input.original, "Original"),
      assertUploadedObjectExists(input.working, "Working"),
      assertUploadedObjectExists(input.thumbnail, "Thumbnail"),
    ]);

    const result = await confirmPageUploadRepository({
      pageId: trimmedPageId,
      uploadedBy: input.userId,
      original: input.original,
      working: input.working,
      thumbnail: input.thumbnail,
    });
    return {
      page: result.page,
      originalAsset: result.originalAsset,
      workingAsset: result.workingAsset,
      thumbnailAsset: result.thumbnailAsset,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message = String((error as Error).message ?? "");
    if (message.includes("Page not found"))
      throw new AppError("Page not found", 404);
    await markPageProcessingFailed(trimmedPageId).catch(() => undefined);
    throw new AppError("Unable to confirm page upload", 400);
  }
}

export async function getPresignedDownloadUrlService(
  fileAssetId: string,
  actor: AccessActor,
  expiresIn?: number,
) {
  const trimmed = fileAssetId.trim();
  if (!trimmed) throw new AppError("File asset id is required", 400);
  const fileAsset = await getFileAssetById(trimmed);
  if (!fileAsset) throw new AppError("File asset not found", 404);
  await assertCanReadFileAsset(actor, trimmed);
  return createPresignedDownloadUrl(fileAsset.r2Key, expiresIn);
}

export async function getFileAssetContentService(
  fileAssetId: string,
  actor: AccessActor,
) {
  const trimmed = fileAssetId.trim();
  if (!trimmed) throw new AppError("File asset id is required", 400);
  const fileAsset = await getFileAssetById(trimmed);
  if (!fileAsset) throw new AppError("File asset not found", 404);
  await assertCanReadFileAsset(actor, trimmed);

  let buffer: Buffer;
  try {
    buffer = await getFileBuffer(fileAsset.r2Key);
  } catch (error) {
    if (isMissingStorageObject(error)) {
      await FileAsset.updateOne(
        { _id: trimmed },
        { $set: { status: "MISSING" } },
      ).catch(() => undefined);
      await Page.updateMany(
        {
          $or: [
            { originalFileAssetId: trimmed },
            { workingFileAssetId: trimmed },
            { thumbnailFileAssetId: trimmed },
            { variantFileAssetIds: trimmed },
          ],
        },
        { $set: { status: "PROCESSING_FAILED" } },
      ).catch(() => undefined);
      throw new AppError(
        "File object is missing from storage. Please re-upload this page asset.",
        404,
      );
    }
    throw error;
  }

  return {
    buffer,
    mimeType: fileAsset.mimeType,
    originalName: fileAsset.originalName,
  };
}

export async function getPageWithFileAssetService(
  pageId: string,
  actor: AccessActor,
) {
  const trimmed = pageId.trim();
  if (!trimmed) throw new AppError("Page id is required", 400);
  await assertCanReadPage(actor, trimmed);
  const page = await getPageWithFileAsset(trimmed);
  if (!page) throw new AppError("Page not found", 404);
  return page;
}
