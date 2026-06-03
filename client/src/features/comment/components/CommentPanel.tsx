import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentList } from "./CommentList";
import { AddCommentForm } from "./AddCommentForm";
import {
  getCommentsForTarget,
  createComment,
  markFixed,
  verifyFixed,
  resolveComment,
  reopenComment,
  type Comment,
  type CommentTargetType
} from "../api/comment";
import { useToast } from "@/shared/components/feedback/Toast";

interface CommentPanelProps {
  targetType: CommentTargetType;
  targetId: string;
  pageId?: string;
  annotationId?: string; // Optional filtering by annotation
  currentUser: { id: string; systemRole: string } | null;
}

export function CommentPanel({
  targetType,
  targetId,
  pageId,
  annotationId,
  currentUser
}: CommentPanelProps) {
  const { getToken } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!targetId) return;

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const list = await getCommentsForTarget(token, targetType, targetId);
      setComments(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [getToken, targetType, targetId]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (content: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const newComment = await createComment(token, {
        targetType,
        targetId,
        pageId,
        annotationId,
        content
      });
      setComments((prev) => [newComment, ...prev]);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add comment", "error");
      throw err;
    }
  };

  const handleMarkFixed = async (commentId: string) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    const updated = await markFixed(token, commentId);
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
  };

  const handleVerifyFixed = async (commentId: string) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    const updated = await verifyFixed(token, commentId);
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
  };

  const handleResolve = async (commentId: string) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    const updated = await resolveComment(token, commentId);
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
  };

  const handleReopen = async (commentId: string, reason: string) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    const updated = await reopenComment(token, commentId, reason);
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
  };

  // Filter comments locally if annotationId is used for targetType PAGE
  const displayedComments = comments.filter((comment) => {
    if (targetType === "PAGE") {
      if (annotationId) {
        return comment.annotationId === annotationId;
      }
      return !comment.annotationId;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#2f243a]">
          {annotationId ? "Annotation Comments" : "Page Comments"}
        </h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void fetchComments()}
          disabled={loading}
          aria-label="Refresh comments"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading && comments.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin mr-2" />
          Loading comments...
        </div>
      ) : (
        <>
          <CommentList
            comments={displayedComments}
            currentUser={currentUser}
            onMarkFixed={handleMarkFixed}
            onVerifyFixed={handleVerifyFixed}
            onResolve={handleResolve}
            onReopen={handleReopen}
          />
          <AddCommentForm onSubmit={handleAddComment} />
        </>
      )}
    </div>
  );
}
