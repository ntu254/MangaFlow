const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export type CommentStatus =
  | "OPEN"
  | "FIXED_BY_ASSISTANT"
  | "VERIFIED_BY_MANGAKA"
  | "RESOLVED_BY_EDITOR";

export type CommentTargetType =
  | "MANUSCRIPT"
  | "CHAPTER"
  | "PAGE"
  | "TASK"
  | "SUBMISSION";

export type Comment = {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  pageId?: string;
  annotationId?: string;
  content: string;
  createdBy: string;
  status: CommentStatus;
  
  fixedBy?: string;
  fixedAt?: string;
  
  verifiedBy?: string;
  verifiedAt?: string;
  
  resolvedBy?: string;
  resolvedAt?: string;
  
  reopenedBy?: string;
  reopenedAt?: string;
  reopenReason?: string;
  
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentPayload = {
  targetType: CommentTargetType;
  targetId: string;
  pageId?: string;
  annotationId?: string;
  content: string;
};

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || fallbackMessage);
  }
  return json.data;
}

export async function getCommentsForTarget(
  token: string,
  targetType: CommentTargetType,
  targetId: string
): Promise<Comment[]> {
  const response = await fetch(`${apiBaseUrl}/comments/target/${targetType}/${targetId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Comment[]>(response, "Failed to fetch comments");
}

export async function createComment(
  token: string,
  payload: CreateCommentPayload
): Promise<Comment> {
  const response = await fetch(`${apiBaseUrl}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return parseApiResponse<Comment>(response, "Failed to create comment");
}

export async function markFixed(token: string, commentId: string): Promise<Comment> {
  const response = await fetch(`${apiBaseUrl}/comments/${commentId}/mark-fixed`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Comment>(response, "Failed to mark comment fixed");
}

export async function verifyFixed(token: string, commentId: string): Promise<Comment> {
  const response = await fetch(`${apiBaseUrl}/comments/${commentId}/verify-fixed`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Comment>(response, "Failed to verify comment fixed");
}

export async function resolveComment(token: string, commentId: string): Promise<Comment> {
  const response = await fetch(`${apiBaseUrl}/comments/${commentId}/resolve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<Comment>(response, "Failed to resolve comment");
}

export async function reopenComment(
  token: string,
  commentId: string,
  reason: string
): Promise<Comment> {
  const response = await fetch(`${apiBaseUrl}/comments/${commentId}/reopen`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ reason })
  });
  return parseApiResponse<Comment>(response, "Failed to reopen comment");
}
