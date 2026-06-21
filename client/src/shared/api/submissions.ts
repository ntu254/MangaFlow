import { api, unwrap } from "./_client";

export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REJECTED";

export interface Submission {
  id: string;
  taskId: string;
  seriesId: string;
  chapterId: string;
  pageId?: string;
  regionId?: string;
  submittedBy: {
    _id: string;
    id: string;
    name: string;
    role: string;
  };
  version: number;
  resultText?: string;
  fileAssetId?: {
    _id: string;
    id: string;
    originalName: string;
  };
  status: SubmissionStatus;
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskSubmissionUpload {
  uploadUrl: string;
  fileAssetId: string;
}

export interface SubmitTaskSubmissionInput {
  taskId: string;
  resultText?: string;
  file?: File;
}

export async function submitTaskSubmission({
  taskId,
  resultText,
  file,
}: SubmitTaskSubmissionInput): Promise<Submission> {
  let fileAssetId: string | undefined;

  if (file) {
    const contentType = file.type || "application/octet-stream";
    const upload = await api
      .post(`/tasks/${taskId}/submissions/upload-url`, {
        originalName: file.name,
        contentType,
        size: file.size,
      })
      .then(unwrap<TaskSubmissionUpload>);

    const uploadResponse = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error(`File upload failed with status ${uploadResponse.status}`);
    }
    fileAssetId = upload.fileAssetId;
  }

  return api
    .post(`/tasks/${taskId}/submissions`, {
      resultText: resultText?.trim() || undefined,
      fileAssetId,
    })
    .then(unwrap<Submission>);
}

export const submissionsApi = {
  listByTask: (taskId: string) =>
    api.get(`/tasks/${taskId}/submissions`).then(unwrap<Submission[]>),
  submitTask: submitTaskSubmission,
  listReviewQueue: (seriesId?: string) =>
    api.get(`/submissions/review-queue`, { params: { seriesId } }).then(unwrap<Submission[]>),
  mangakaApprove: (id: string, reviewerNote?: string) =>
    api.post(`/submissions/${id}/mangaka-approve`, { reviewerNote }).then(unwrap<Submission>),
  editorApprove: (id: string, reviewerNote?: string) =>
    api.post(`/submissions/${id}/editor-approve`, { reviewerNote }).then(unwrap<Submission>),
  requestRevision: (id: string, reviewerNote?: string) =>
    api.post(`/submissions/${id}/request-revision`, { reviewerNote }).then(unwrap<Submission>),
};
