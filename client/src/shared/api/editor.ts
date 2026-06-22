import { api, unwrap } from "./_client";
import type { PublicationType, Series } from "./series";

type ApiRecord = Record<string, unknown>;

export interface EditorReviewManuscript {
  id: string;
  seriesId: string;
  version: number;
  status: string;
  reviewNote?: string;
  editorRecommendation?: string;
  feasibilityNote?: string;
  suggestedPublicationType?: PublicationType;
  riskNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EditorReviewQueueItem {
  series: Series;
  manuscript: EditorReviewManuscript | null;
}

export interface EditorSeriesReview {
  series: Series;
  manuscript: EditorReviewManuscript;
}

export interface EditorRevisionInput {
  revisionReason: string;
  feedbackSummary: string;
  reviewNote?: string;
}

export interface EditorRejectInput {
  rejectReason: string;
  reviewNote?: string;
}

export interface EditorForwardInput {
  editorRecommendation: string;
  feasibilityNote: string;
  suggestedPublicationType: PublicationType;
  riskNote?: string;
}

export interface EditorWorkspaceSeries {
  series: Series;
  currentChapter?: {
    id: string;
    title: string;
    chapterNumber: number;
    status: string;
    updatedAt?: string;
  } | null;
  pendingFinalReviews: number;
  activeTasks: number;
  blockers: number;
  deadlineRisk: number;
  latestRanking?: {
    id: string;
    period: string;
    voteCount: number;
    readerScore: number;
    finalScore: number;
    status: string;
  } | null;
}

export interface EditorProductionProgress {
  series: Series;
  chapters: Array<{
    id: string;
    title: string;
    chapterNumber: number;
    status: string;
    pagesTotal: number;
    pagesApproved: number;
    pages?: Array<{
      id: string;
      pageNumber: number;
      status: string;
      hasWorkingFile: boolean;
    }>;
    tasksTotal: number;
    tasksApproved: number;
    pendingEditorReviews: number;
    readinessPercent: number;
    updatedAt?: string;
  }>;
}

export interface EditorRankingRisk {
  series: Series;
  latestRanking?: {
    id: string;
    period: string;
    voteCount: number;
    readerScore: number;
    finalScore: number;
    status: string;
    updatedAt?: string;
  } | null;
  riskLevel: "HIGH" | "WATCH" | "STABLE";
  trend: Array<{
    id: string;
    period: string;
    voteCount: number;
    readerScore: number;
    finalScore: number;
    status: string;
    updatedAt?: string;
  }>;
  latestDecision?: {
    id: string;
    decision: string;
    note?: string;
    createdAt?: string;
  } | null;
}

export interface EditorDecisionHistoryItem {
  id: string;
  type: string;
  seriesId: string;
  seriesTitle: string;
  result: string;
  detail?: string;
  actor?: string;
  decidedAt?: string;
}

export interface EditorActivityItem {
  id: string;
  type: string;
  seriesId: string;
  seriesTitle: string;
  detail?: string;
  at?: string;
}

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" ? (value as ApiRecord) : {};
}

function stringField(record: ApiRecord, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

function stringArrayField(record: ApiRecord, key: string): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function idOf(record: ApiRecord): string {
  return stringField(record, "id") || stringField(record, "_id");
}

function mapSeries(value: unknown): Series {
  const record = asRecord(value);
  return {
    id: idOf(record),
    title: stringField(record, "title"),
    slug: stringField(record, "slug"),
    synopsis: stringField(record, "synopsis"),
    logline: stringField(record, "logline") || undefined,
    premise: stringField(record, "premise") || undefined,
    characters: stringField(record, "characters") || undefined,
    conflict: stringField(record, "conflict") || undefined,
    targetAudience: stringField(record, "targetAudience") || undefined,
    requestedPublicationType: stringField(record, "requestedPublicationType") as PublicationType,
    publicationType: stringField(record, "publicationType") as PublicationType,
    tags: stringArrayField(record, "tags"),
    genres: stringArrayField(record, "genres"),
    ownerId: stringField(record, "ownerId"),
    status: stringField(record, "status"),
    createdAt: stringField(record, "createdAt"),
    updatedAt: stringField(record, "updatedAt"),
  };
}

function mapManuscript(value: unknown): EditorReviewManuscript | null {
  if (!value) return null;
  const record = asRecord(value);
  const version = record.version;
  return {
    id: idOf(record),
    seriesId: stringField(record, "seriesId"),
    version: typeof version === "number" ? version : 1,
    status: stringField(record, "status"),
    reviewNote: stringField(record, "reviewNote") || undefined,
    editorRecommendation: stringField(record, "editorRecommendation") || undefined,
    feasibilityNote: stringField(record, "feasibilityNote") || undefined,
    suggestedPublicationType: stringField(record, "suggestedPublicationType") as PublicationType,
    riskNote: stringField(record, "riskNote") || undefined,
    createdAt: stringField(record, "createdAt") || undefined,
    updatedAt: stringField(record, "updatedAt") || undefined,
  };
}

function mapQueueItem(value: unknown): EditorReviewQueueItem {
  const record = asRecord(value);
  return {
    series: mapSeries(record.series),
    manuscript: mapManuscript(record.manuscript),
  };
}

function mapReview(value: unknown): EditorSeriesReview {
  const record = asRecord(value);
  const manuscript = mapManuscript(record.manuscript);
  if (!manuscript) throw new Error("Series review response is missing manuscript");
  return {
    series: mapSeries(record.series),
    manuscript,
  };
}

export const editorApi = {
  reviewQueue: () =>
    api
      .get("/editor/manuscripts/review-queue")
      .then(unwrap<unknown[]>)
      .then((items) => items.map(mapQueueItem)),
  getSeriesReview: (seriesId: string) =>
    api
      .get(`/editor/series/${seriesId}/review`)
      .then(unwrap<unknown>)
      .then(mapReview),
  requestRevision: (seriesId: string, input: EditorRevisionInput) =>
    api.post(`/editor/series/${seriesId}/request-revision`, input).then(unwrap<unknown>),
  rejectSeries: (seriesId: string, input: EditorRejectInput) =>
    api.post(`/editor/series/${seriesId}/reject`, input).then(unwrap<unknown>),
  forwardToBoard: (seriesId: string, input: EditorForwardInput) =>
    api.post(`/editor/series/${seriesId}/forward-to-board`, input).then(unwrap<unknown>),
  managedSeries: () => api.get("/editor/managed-series").then(unwrap<EditorWorkspaceSeries[]>),
  productionProgress: () =>
    api.get("/editor/production-progress").then(unwrap<EditorProductionProgress[]>),
  rankingRisk: () => api.get("/editor/ranking-risk").then(unwrap<EditorRankingRisk[]>),
  decisionHistory: () =>
    api.get("/editor/decision-history").then(unwrap<EditorDecisionHistoryItem[]>),
  activity: () => api.get("/editor/activity").then(unwrap<EditorActivityItem[]>),
  getTask: (taskId: string) => api.get(`/tasks/${taskId}`).then(unwrap<unknown>),
  listFinalReviewQueue: (seriesId?: string) =>
    api.get(`/submissions/review-queue`, { params: { seriesId } }).then(unwrap<unknown[]>),
  editorApproveSubmission: (submissionId: string, reviewerNote?: string) =>
    api.post(`/submissions/${submissionId}/editor-approve`, { reviewerNote }).then(unwrap<unknown>),
  editorRejectSubmission: (submissionId: string, reviewerNote: string) =>
    api.post(`/submissions/${submissionId}/editor-reject`, { reviewerNote }).then(unwrap<unknown>),
  editorRequestSubmissionRevision: (submissionId: string, reviewerNote: string) =>
    api
      .post(`/submissions/${submissionId}/request-revision`, { reviewerNote })
      .then(unwrap<unknown>),
};
