export type CommentManagementAction = "resolve" | "reopen";

export function getCommentManagementAction(status: string): CommentManagementAction | undefined {
  if (status === "OPEN" || status === "REOPENED") return "resolve";
  if (status === "ADDRESSED" || status === "RESOLVED") return "reopen";
  return undefined;
}

export function getCommentManagementEndpoint(
  commentId: string,
  status: string,
): string | undefined {
  const action = getCommentManagementAction(status);
  return action ? `/comments/${commentId}/${action}` : undefined;
}

export function getCommentManagementRequest(commentId: string, status: string) {
  const path = getCommentManagementEndpoint(commentId, status);
  return path
    ? ({ method: "POST" as const, path, body: {} } satisfies {
        method: "POST";
        path: string;
        body: Record<string, never>;
      })
    : undefined;
}
