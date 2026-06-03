import { CommentItem } from "./CommentItem";
import type { Comment } from "../api/comment";

interface CommentListProps {
  comments: Comment[];
  currentUser: { id: string; systemRole: string } | null;
  onMarkFixed: (commentId: string) => Promise<void>;
  onVerifyFixed: (commentId: string) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onReopen: (commentId: string, reason: string) => Promise<void>;
}

export function CommentList({
  comments,
  currentUser,
  onMarkFixed,
  onVerifyFixed,
  onResolve,
  onReopen
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground bg-muted/10">
        No comments yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUser={currentUser}
          onMarkFixed={onMarkFixed}
          onVerifyFixed={onVerifyFixed}
          onResolve={onResolve}
          onReopen={onReopen}
        />
      ))}
    </div>
  );
}
