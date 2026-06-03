import { apiBaseUrl, parseApiResponse } from "@/shared/api";

export type SubmissionStatus =
  | "PENDING_MANGAKA_REVIEW"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REJECTED";

export type Submission = {
  id: string;
  taskId: string;
  submittedBy: string;
  fileUrl: string;
  previewUrl?: string;
  note?: string;
  version: number;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubmissionPayload = {
  fileUrl: string;
  previewUrl?: string;
  note?: string;
};

export async function listSubmissions(token: string): Promise<Submission[]> {
  const response = await fetch(`${apiBaseUrl}/submissions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Submission[]>(response, "Failed to list submissions");
}

export async function listTaskSubmissions(token: string, taskId: string): Promise<Submission[]> {
  const response = await fetch(`${apiBaseUrl}/tasks/${taskId}/submissions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Submission[]>(response, "Failed to list task submissions");
}

export async function createTaskSubmission(
  token: string,
  taskId: string,
  payload: CreateSubmissionPayload
): Promise<Submission> {
  const response = await fetch(`${apiBaseUrl}/tasks/${taskId}/submissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return parseApiResponse<Submission>(response, "Failed to create task submission");
}

export async function getSubmission(token: string, submissionId: string): Promise<Submission> {
  const response = await fetch(`${apiBaseUrl}/submissions/${submissionId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Submission>(response, "Failed to fetch submission");
}
