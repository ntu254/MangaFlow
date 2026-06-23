import { api, unwrap } from "./_client";

export type PublicationType = "WEEKLY" | "MONTHLY";
export type SeriesStatus =
  | "DRAFT"
  | "EDITOR_REVIEW"
  | "REVISION_REQUESTED"
  | "BOARD_REVIEW"
  | "ONGOING"
  | "AT_RISK"
  | "CANCELLED"
  | "COMPLETED"
  | "ARCHIVED"
  | "REJECTED"
  | "WITHDRAWN";

export interface Series {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  logline?: string;
  premise?: string;
  characters?: string;
  conflict?: string;
  targetAudience?: string;
  requestedPublicationType?: PublicationType;
  publicationType?: PublicationType;
  tags: string[];
  genres: string[];
  cover?: string;
  ownerId: string;
  status: SeriesStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSeriesInput {
  title: string;
  synopsis?: string;
  logline?: string;
  premise?: string;
  characters?: string;
  conflict?: string;
  targetAudience?: string;
  requestedPublicationType?: PublicationType;
  tags?: string[];
  genres?: string[];
}

export type UpdateSeriesInput = Partial<CreateSeriesInput> & { cover?: string };

export interface SeriesMemberUser {
  id?: string;
  _id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  role?: string;
}

export interface SeriesMember {
  id?: string;
  _id?: string;
  role: "MANGAKA" | "ASSISTANT" | "EDITOR";
  status: "INVITED" | "ACTIVE" | "REMOVED" | "PAUSED";
  isActive?: boolean;
  accessScope?: "FULL" | "TASK_ONLY";
  user?: SeriesMemberUser;
  userId?: SeriesMemberUser | string;
  series?: Series;
  seriesId?: Series | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeriesSummaryFile {
  id: string;
  originalName?: string;
  mimeType?: string;
  assetType?: string;
  size?: number;
  status?: string;
  createdAt?: string;
}

export interface SeriesSummaryManuscript {
  id: string;
  version: number;
  status: string;
  reviewNote?: string;
  createdAt?: string;
  updatedAt?: string;
  file?: SeriesSummaryFile | null;
  uploadedBy?: { id?: string; name?: string; email?: string } | null;
}

export interface SeriesSummaryChapter {
  id: string;
  chapterNumber?: number;
  title?: string;
  status?: string;
  pageCount: number;
  approvedPages: number;
  draftSchedule?: string;
  updatedAt: string;
}

export interface SeriesSummaryTask {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  createdAt?: string;
  assignee?: string | null;
}

export interface SeriesSummarySubmission {
  id: string;
  version: number;
  status: string;
  submittedBy?: string | null;
  createdAt?: string;
}

export interface SeriesSummaryComment {
  id: string;
  body: string;
  status: string;
  isBlocking?: boolean;
  author?: string | null;
  authorRole?: string;
  updatedAt?: string;
}

export interface SeriesSummary {
  series?: Series;
  owner?: { id?: string; name?: string; email?: string } | null;
  members?: SeriesMember[];
  manuscripts?: SeriesSummaryManuscript[];
  currentManuscript?: SeriesSummaryManuscript | null;
  files?: SeriesSummaryFile[];
  boardReview?: { status?: string; result?: string; voteCount?: number; updatedAt?: string } | null;
  chapters?: SeriesSummaryChapter[];
  currentChapter?: SeriesSummaryChapter | null;
  chapterSummary?: {
    total: number;
    completed: number;
    inProduction: number;
    totalPages: number;
    approvedPages: number;
    readinessPercent: number;
  };
  taskSummary?: {
    total: number;
    pending: number;
    completed: number;
    pendingReviews: number;
  };
  recentTasks?: SeriesSummaryTask[];
  recentSubmissions?: SeriesSummarySubmission[];
  commentSummary?: {
    open: number;
    resolved: number;
    blocking: number;
  };
  recentComments?: SeriesSummaryComment[];
  publicationSummary?: {
    isReady: boolean;
    scheduled: number;
    published: number;
    blockers: string[];
  };
  rankingSummary?: {
    period?: string;
    voteCount?: number;
    readerScore?: number;
    finalScore?: number;
    status?: string;
  } | null;
  payrollSummary?: {
    totalEarnings: number;
    unpaid: number;
  };
  allowedActions?: {
    canEditSeries: boolean;
    canUploadManuscript: boolean;
    canOpenWorkspace: boolean;
  };
}

export interface AddSeriesMemberInput {
  userId?: string;
  email?: string;
  role: "ASSISTANT" | "EDITOR";
  accessScope: "FULL" | "TASK_ONLY";
}

function normalizeSeriesList(payload: unknown): Series[] {
  if (Array.isArray(payload)) return payload as Series[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const candidate = record.items ?? record.series ?? record.data ?? record.results;
  return Array.isArray(candidate) ? (candidate as Series[]) : [];
}

export const seriesApi = {
  list: () => api.get("/series").then((res) => normalizeSeriesList(unwrap<unknown>(res))),
  get: (id: string) => api.get(`/series/${id}`).then(unwrap<Series>),
  create: (body: CreateSeriesInput) => api.post("/series", body).then(unwrap<Series>),
  update: (id: string, body: UpdateSeriesInput) =>
    api.patch(`/series/${id}`, body).then(unwrap<Series>),
  submitForReview: (id: string, editorNote?: string) =>
    api.post(`/series/${id}/submit`, editorNote ? { editorNote } : {}).then(unwrap<Series>),
  assignEditor: (id: string, editorUserId: string) =>
    api.post(`/series/${id}/assign-editor`, { editorUserId }).then(unwrap<SeriesMember>),
  getSummary: (id: string) => api.get(`/series/${id}/summary`).then(unwrap<SeriesSummary>),
  listMembers: (seriesId: string) =>
    api.get(`/series/${seriesId}/members`).then(unwrap<SeriesMember[]>),
  listMyMemberships: () => api.get(`/series/memberships/my`).then(unwrap<SeriesMember[]>),
  addMember: (seriesId: string, payload: AddSeriesMemberInput) =>
    api.post(`/series/${seriesId}/members`, payload).then(unwrap<SeriesMember>),
  deleteDraft: (id: string) => api.delete(`/series/${id}/draft`).then(unwrap<void>),
  withdraw: (id: string) => api.post(`/series/${id}/withdraw`).then(unwrap<void>),
  cancel: (id: string) => api.post(`/series/${id}/cancel`).then(unwrap<void>),
  hardDelete: (id: string) => api.delete(`/series/${id}/hard`).then(unwrap<void>),
  updateMember: (seriesId: string, memberId: string, payload: Record<string, unknown>) =>
    api.patch(`/series/${seriesId}/members/${memberId}`, payload).then(unwrap<SeriesMember>),
  acceptMemberInvite: (seriesId: string, memberId?: string) =>
    api
      .post(
        memberId
          ? `/series/${seriesId}/members/${memberId}/accept`
          : `/series/${seriesId}/members/accept`,
      )
      .then(unwrap<SeriesMember>),
  removeMember: (seriesId: string, memberId: string) =>
    api.delete(`/series/${seriesId}/members/${memberId}`).then(unwrap<void>),
  getCoverUploadUrl: (seriesId: string, payload: { originalName: string; contentType: string }) =>
    api
      .post(`/series/${seriesId}/cover/upload-url`, payload)
      .then(unwrap<{ uploadUrl: string; r2Key: string; expiresIn: number }>),
};
