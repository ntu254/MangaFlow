import { api, unwrap } from "./_client";

export type PublicationStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "CANCELLED";

/** Populated chapter object returned when listing publications */
export interface PublicationChapter {
  id: string;
  chapterNumber: number;
  title: string;
  status: string;
}

export interface Publication {
  id: string;
  chapterId: string | PublicationChapter;
  chapterVersionId?:
    | string
    | { id?: string; _id?: string; version?: number; status?: string; isLocked?: boolean };
  seriesId: string;
  status: PublicationStatus;
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePublicationInput {
  chapterId: string;
  scheduledFor?: string; // ISO date string
}

export interface SchedulePublicationInput {
  scheduledFor: string; // ISO date string
}

export const publicationsApi = {
  list: async (seriesId?: string) =>
    api
      .get("/publications", { params: seriesId ? { seriesId } : undefined })
      .then(unwrap<Publication[]>),

  create: async (input: CreatePublicationInput) =>
    api.post("/publications", input).then(unwrap<Publication>),

  schedule: async (publicationId: string, input: SchedulePublicationInput) =>
    api.post(`/publications/${publicationId}/schedule`, input).then(unwrap<Publication>),

  patch: async (publicationId: string, input: Partial<SchedulePublicationInput>) =>
    api.patch(`/publications/${publicationId}`, input).then(unwrap<Publication>),

  cancel: async (publicationId: string) =>
    api.post(`/publications/${publicationId}/cancel`).then(unwrap<Publication>),

  publish: async (publicationId: string) =>
    api.post(`/publications/${publicationId}/publish`).then(unwrap<Publication>),
};
