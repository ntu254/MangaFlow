import { api, unwrap } from "./_client";

export type ChapterVersionStatus = "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED";
export type ChapterReviewAnnotationStatus = "OPEN" | "RESOLVED";

export interface ChapterPageSnapshot {
  pageId: string;
  pageNumber: number;
  fileAssetId: string;
  originalFileAssetId?: string;
  workingFileAssetId?: string;
  thumbnailFileAssetId?: string;
  status: string;
}

export interface ChapterVersionRef {
  id: string;
  seriesId: string;
  chapterId:
    | string
    | {
        id?: string;
        _id?: string;
        chapterNumber?: number;
        title?: string;
        status?: string;
      };
  version: number;
  status: ChapterVersionStatus;
  submittedBy?: string | { name?: string; displayName?: string; email?: string };
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerNote?: string;
  isLocked: boolean;
  lockedAt?: string;
  pageSnapshots: ChapterPageSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface ChapterReviewAnnotation {
  id: string;
  chapterVersionId: string;
  chapterId: string;
  pageId?: string;
  body: string;
  geometry?: { x?: number; y?: number; width?: number; height?: number };
  isBlocking: boolean;
  status: ChapterReviewAnnotationStatus;
  authorId?: string | { name?: string; displayName?: string; email?: string; role?: string };
  createdAt: string;
  updatedAt: string;
}

export interface ChapterVersionDetail {
  version: ChapterVersionRef;
  annotations: ChapterReviewAnnotation[];
}

export interface EditorChapterReviewQueueItem extends ChapterVersionRef {
  seriesId:
    | string
    | {
        id?: string;
        _id?: string;
        title?: string;
        slug?: string;
        status?: string;
      };
}

export interface ChapterReviewDecisionInput {
  reviewerNote?: string;
}

export interface CreateChapterReviewAnnotationInput {
  pageId?: string;
  body: string;
  geometry?: { x?: number; y?: number; width?: number; height?: number };
  isBlocking?: boolean;
}

export interface PatchChapterReviewAnnotationInput {
  body?: string;
  geometry?: { x?: number; y?: number; width?: number; height?: number };
  isBlocking?: boolean;
  status?: ChapterReviewAnnotationStatus;
}

type Mongoish<T> = T & { _id?: string };

function idOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as { id?: string; _id?: string };
    return record.id ?? record._id ?? "";
  }
  return String(value);
}

function normalizeRef<T extends Record<string, unknown>>(value: T | string | undefined): T | string | undefined {
  if (!value || typeof value === "string") return value;
  return { ...value, id: idOf(value) };
}

function normalizeSnapshot(snapshot: Mongoish<ChapterPageSnapshot>): ChapterPageSnapshot {
  return {
    ...snapshot,
    pageId: idOf(snapshot.pageId),
    fileAssetId: idOf(snapshot.fileAssetId),
    originalFileAssetId: snapshot.originalFileAssetId ? idOf(snapshot.originalFileAssetId) : undefined,
    workingFileAssetId: snapshot.workingFileAssetId ? idOf(snapshot.workingFileAssetId) : undefined,
    thumbnailFileAssetId: snapshot.thumbnailFileAssetId ? idOf(snapshot.thumbnailFileAssetId) : undefined,
  };
}

function normalizeVersion<T extends ChapterVersionRef>(version: Mongoish<T>): T {
  return {
    ...version,
    id: idOf(version),
    seriesId: normalizeRef(version.seriesId as never) as T["seriesId"],
    chapterId: normalizeRef(version.chapterId as never) as T["chapterId"],
    submittedBy: normalizeRef(version.submittedBy as never) as T["submittedBy"],
    reviewedBy: version.reviewedBy ? idOf(version.reviewedBy) : undefined,
    pageSnapshots: (version.pageSnapshots ?? []).map(normalizeSnapshot),
  };
}

function normalizeAnnotation(annotation: Mongoish<ChapterReviewAnnotation>): ChapterReviewAnnotation {
  return {
    ...annotation,
    id: idOf(annotation),
    chapterVersionId: idOf(annotation.chapterVersionId),
    chapterId: idOf(annotation.chapterId),
    pageId: annotation.pageId ? idOf(annotation.pageId) : undefined,
    authorId: normalizeRef(annotation.authorId as never) as ChapterReviewAnnotation["authorId"],
  };
}

function normalizeDetail(detail: ChapterVersionDetail): ChapterVersionDetail {
  return {
    version: normalizeVersion(detail.version),
    annotations: (detail.annotations ?? []).map(normalizeAnnotation),
  };
}

export const chapterReviewsApi = {
  submitChapterVersion: (chapterId: string) =>
    api
      .post(`/chapters/${chapterId}/review-versions`)
      .then(unwrap<ChapterVersionRef>)
      .then(normalizeVersion),
  listChapterVersions: (chapterId: string) =>
    api
      .get(`/chapters/${chapterId}/review-versions`)
      .then(unwrap<ChapterVersionRef[]>)
      .then((versions) => versions.map(normalizeVersion)),
  getVersionDetail: (versionId: string) =>
    api.get(`/chapter-review-versions/${versionId}`).then(unwrap<ChapterVersionDetail>).then(normalizeDetail),
  listEditorQueue: () =>
    api
      .get("/editor/chapter-review-queue")
      .then(unwrap<EditorChapterReviewQueueItem[]>)
      .then((versions) => versions.map(normalizeVersion)),
  requestRevision: (versionId: string, input: ChapterReviewDecisionInput) =>
    api
      .post(`/editor/chapter-review-versions/${versionId}/request-revision`, input)
      .then(unwrap<ChapterVersionRef>)
      .then(normalizeVersion),
  approve: (versionId: string, input: ChapterReviewDecisionInput) =>
    api
      .post(`/editor/chapter-review-versions/${versionId}/approve`, input)
      .then(unwrap<ChapterVersionRef>)
      .then(normalizeVersion),
  listAnnotations: (versionId: string) =>
    api
      .get(`/chapter-review-versions/${versionId}/annotations`)
      .then(unwrap<ChapterReviewAnnotation[]>)
      .then((annotations) => annotations.map(normalizeAnnotation)),
  createAnnotation: (versionId: string, input: CreateChapterReviewAnnotationInput) =>
    api
      .post(`/chapter-review-versions/${versionId}/annotations`, input)
      .then(unwrap<ChapterReviewAnnotation>)
      .then(normalizeAnnotation),
  patchAnnotation: (annotationId: string, input: PatchChapterReviewAnnotationInput) =>
    api
      .patch(`/chapter-review-annotations/${annotationId}`, input)
      .then(unwrap<ChapterReviewAnnotation>)
      .then(normalizeAnnotation),
};
