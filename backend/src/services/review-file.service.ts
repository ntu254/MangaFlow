import path from "node:path";
import {
  ChapterModel,
  ChapterReviewModel,
  ProposalModel,
  SeriesModel,
  SubmissionModel,
} from "../db/models.js";
import { assertCanReadProposal } from "./authorization.service.js";
import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";

export type ReviewFile = {
  id: string;
  key: string;
  name: string;
  mimeType: string;
  size: number | null;
  version?: string;
  submittedAt?: string;
  submittedBy?: string;
  previewKind: "image" | "pdf" | "external";
};

export type ReviewFileContext = { context: "proposal" | "chapter"; id: string };

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asIso(value: unknown) {
  if (!value) return undefined;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

function fileKey(record: any) {
  return nonEmptyString(record?.fileKey) ?? nonEmptyString(record?.key) ?? nonEmptyString(record?.file?.key);
}

function previewKind(key: string, mimeType: string): ReviewFile["previewKind"] {
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(key)) return "image";
  if (mimeType === "application/pdf" || /\.pdf$/i.test(key)) return "pdf";
  return "external";
}

function normalizeReviewFile(record: any, fallbackId: string): ReviewFile | null {
  const key = fileKey(record);
  if (!key) return null;

  const mimeType =
    nonEmptyString(record?.mimeType) ??
    nonEmptyString(record?.fileType) ??
    nonEmptyString(record?.file?.mimeType) ??
    "application/octet-stream";
  const explicitSize = record?.size ?? record?.file?.size;
  const size = Number.isFinite(Number(explicitSize))
    ? Number(explicitSize)
    : Number.isFinite(Number(record?.sizeKB))
      ? Number(record.sizeKB) * 1024
      : Number.isFinite(Number(record?.fileSizeKB))
        ? Number(record.fileSizeKB) * 1024
        : null;
  const submittedBy =
    nonEmptyString(record?.submittedBy) ??
    nonEmptyString(record?.uploadedByName) ??
    nonEmptyString(record?.assistantName) ??
    nonEmptyString(record?.submittedBy?.name);

  return {
    id: nonEmptyString(record?.id) ?? fallbackId,
    key,
    name:
      nonEmptyString(record?.fileName) ??
      nonEmptyString(record?.name) ??
      nonEmptyString(record?.title) ??
      nonEmptyString(record?.file?.originalName) ??
      path.basename(key),
    mimeType,
    size,
    ...(record?.version !== undefined || record?.currentVersion !== undefined
      ? { version: String(record?.version ?? record?.currentVersion) }
      : {}),
    ...(asIso(record?.submittedAt ?? record?.uploadedAt ?? record?.createdAt)
      ? { submittedAt: asIso(record?.submittedAt ?? record?.uploadedAt ?? record?.createdAt) }
      : {}),
    ...(submittedBy ? { submittedBy } : {}),
    previewKind: previewKind(key, mimeType),
  };
}

function normalizedFiles(records: any[], prefix: string) {
  return records
    .map((record, index) => normalizeReviewFile(record, `${prefix}-${index + 1}`))
    .filter((record): record is ReviewFile => record !== null);
}

async function proposalReviewFiles(actor: RequestActor, proposalId: string) {
  const proposal = await ProposalModel.findOne({ id: proposalId }).lean();
  if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
  await assertCanReadProposal(actor, proposal);

  const manuscripts = Array.isArray((proposal as any).manuscripts) ? (proposal as any).manuscripts : [];
  const currentManuscript = manuscripts.length > 0 ? [manuscripts[manuscripts.length - 1]] : [];
  const attachments = Array.isArray((proposal as any).materials) ? (proposal as any).materials : [];
  return normalizedFiles([...currentManuscript, ...attachments], `proposal-${proposalId}`);
}

async function chapterReviewFiles(actor: RequestActor, chapterId: string) {
  const chapter = await ChapterModel.findOne({ id: chapterId }).lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  const series = await SeriesModel.findOne({ id: (chapter as any).seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if ((series as any).editorId !== actor.id) {
    throw new AppError(403, "Chapter review files require an assigned Tantou.", "FORBIDDEN");
  }

  const review = await ChapterReviewModel.findOne({ chapterId, status: "OPEN" })
    .sort({ createdAt: -1 })
    .lean();
  if (!review) return [];

  const snapshot = (review as any).snapshot ?? {};
  const pages = Array.isArray(snapshot.pages) ? snapshot.pages : [];
  const submissionIds = Array.isArray(snapshot.submissionIds) ? snapshot.submissionIds : [];
  const submissions = submissionIds.length
    ? await SubmissionModel.find({ id: { $in: submissionIds }, chapterId }).lean()
    : [];
  return normalizedFiles([...pages, ...submissions], `chapter-${chapterId}`);
}

export async function listReviewFiles(actor: RequestActor, input: ReviewFileContext): Promise<ReviewFile[]> {
  if (input.context === "proposal") return proposalReviewFiles(actor, input.id);
  if (actor.role !== "EDITOR") {
    throw new AppError(403, "Chapter review files require an assigned Tantou.", "FORBIDDEN");
  }
  return chapterReviewFiles(actor, input.id);
}
