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

export type UpdateSeriesInput = Partial<CreateSeriesInput>;

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

export interface AddSeriesMemberInput {
  userId?: string;
  email?: string;
  role: "ASSISTANT" | "EDITOR";
  accessScope: "FULL" | "TASK_ONLY";
}

export const seriesApi = {
  list: () => api.get("/series").then(unwrap<Series[]>),
  get: (id: string) => api.get(`/series/${id}`).then(unwrap<Series>),
  create: (body: CreateSeriesInput) => api.post("/series", body).then(unwrap<Series>),
  update: (id: string, body: UpdateSeriesInput) =>
    api.patch(`/series/${id}`, body).then(unwrap<Series>),
  submitForReview: (id: string, editorNote?: string) =>
    api.post(`/series/${id}/submit`, editorNote ? { editorNote } : {}).then(unwrap<Series>),
  getSummary: (id: string) => api.get(`/series/${id}/summary`).then(unwrap<any>),
  listMembers: (seriesId: string) =>
    api.get(`/series/${seriesId}/members`).then(unwrap<SeriesMember[]>),
  listMyMemberships: () => api.get(`/series/memberships/my`).then(unwrap<SeriesMember[]>),
  addMember: (seriesId: string, payload: AddSeriesMemberInput) =>
    api.post(`/series/${seriesId}/members`, payload).then(unwrap<SeriesMember>),
  deleteDraft: (id: string) => api.delete(`/series/${id}/draft`).then(unwrap<void>),
  withdraw: (id: string) => api.post(`/series/${id}/withdraw`).then(unwrap<void>),
  cancel: (id: string) => api.post(`/series/${id}/cancel`).then(unwrap<void>),
  hardDelete: (id: string) => api.delete(`/series/${id}/hard`).then(unwrap<void>),
  updateMember: (seriesId: string, memberId: string, payload: any) =>
    api.patch(`/series/${seriesId}/members/${memberId}`, payload).then(unwrap<any>),
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
};
