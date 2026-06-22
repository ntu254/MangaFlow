import { api, unwrap } from "./_client";

export type CommentStatus = "OPEN" | "FIXED" | "VERIFIED" | "RESOLVED" | "REOPENED";
export type CommentVisibility = "PUBLIC_TO_ASSISTANT" | "MANGAKA_EDITOR_ONLY" | "EDITOR_INTERNAL";

export interface Comment {
  id: string;
  seriesId: string;
  chapterId?: string;
  pageId?: string;
  regionId?: string;
  taskId?: string;
  submissionId?: string;
  authorId: string | { id?: string; _id?: string; name?: string; role?: string };
  body: string;
  status: CommentStatus;
  visibility: CommentVisibility;
  isBlocking: boolean;
  fixedBy?: string;
  verifiedBy?: string;
  resolvedBy?: string;
  reopenedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  seriesId: string;
  chapterId?: string;
  pageId?: string;
  regionId?: string;
  taskId?: string;
  submissionId?: string;
  body: string;
  isBlocking?: boolean;
  visibility?: CommentVisibility;
}

export const commentsApi = {
  create: (input: CreateCommentInput) =>
    api.post("/comments", input).then(unwrap<{ success: boolean; data: Comment }>).then(r => r.data),
  listByTask: (taskId: string) =>
    api.get(`/comments/task/${taskId}`).then(unwrap<{ success: boolean; data: Comment[] }>).then(r => r.data),
  markFixed: (id: string) =>
    api.post(`/comments/${id}/mark-fixed`).then(unwrap<{ success: boolean; data: Comment }>).then(r => r.data),
  verifyFixed: (id: string) =>
    api.post(`/comments/${id}/verify-fixed`).then(unwrap<{ success: boolean; data: Comment }>).then(r => r.data),
  resolve: (id: string) =>
    api.post(`/comments/${id}/resolve`).then(unwrap<{ success: boolean; data: Comment }>).then(r => r.data),
  reopen: (id: string) =>
    api.post(`/comments/${id}/reopen`).then(unwrap<{ success: boolean; data: Comment }>).then(r => r.data),
};
