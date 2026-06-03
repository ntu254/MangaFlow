import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReopenDialog } from "./ReopenDialog";
import type { Comment } from "../api/comment";
import { Check, CheckCircle2, RotateCcw, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/shared/components/feedback/Toast";

interface CommentItemProps {
  comment: Comment;
  currentUser: { id: string; systemRole: string } | null;
  onMarkFixed: (commentId: string) => Promise<void>;
  onVerifyFixed: (commentId: string) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onReopen: (commentId: string, reason: string) => Promise<void>;
}

export function CommentItem({
  comment,
  currentUser,
  onMarkFixed,
  onVerifyFixed,
  onResolve,
  onReopen
}: CommentItemProps) {
  const [reopenOpen, setReopenOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const { toast } = useToast();

  const role = currentUser?.systemRole ?? "";
  const isAdmin = role === "ADMIN";
  const isAssistant = role === "ASSISTANT";
  const isMangaka = role === "MANGAKA";
  const isEditor = role === "EDITOR";

  // Check roles based on spec requirements
  const canMarkFixed = comment.status === "OPEN" && (isAssistant || isAdmin);
  const canVerifyFixed = comment.status === "FIXED_BY_ASSISTANT" && (isMangaka || isAdmin);
  const canResolve = comment.status !== "RESOLVED_BY_EDITOR" && (isEditor || isAdmin);
  const canReopen = (comment.status === "RESOLVED_BY_EDITOR" || comment.status === "VERIFIED_BY_MANGAKA") && (isEditor || isAdmin);

  const handleAction = async (actionFn: () => Promise<void>) => {
    try {
      setTransitioning(true);
      await actionFn();
    } catch (err) {
      console.error(err);
      toast(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setTransitioning(false);
    }
  };

  const getStatusBadge = () => {
    switch (comment.status) {
      case "OPEN":
        return <Badge variant="destructive">Open</Badge>;
      case "FIXED_BY_ASSISTANT":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Fixed (Assistant)</Badge>;
      case "VERIFIED_BY_MANGAKA":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Verified (Mangaka)</Badge>;
      case "RESOLVED_BY_EDITOR":
        return <Badge variant="secondary">Resolved</Badge>;
      default:
        return <Badge>{comment.status}</Badge>;
    }
  };

  const formatUserId = (id: string) => {
    if (currentUser && id === currentUser.id) return "You";
    return `User (${id.slice(-6)})`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[#2f243a]">
            {formatUserId(comment.createdBy)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {comment.content}
      </p>

      {/* Target Details */}
      {(comment.pageId || comment.annotationId) && (
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          {comment.annotationId && <span>Annotation: {comment.annotationId}</span>}
        </div>
      )}

      {/* History Log */}
      <div className="mt-3 border-t pt-2 space-y-1">
        <h4 className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
          Action Logs
        </h4>
        <ul className="text-xs space-y-1 text-muted-foreground">
          {comment.fixedBy && (
            <li className="flex items-center gap-1.5">
              <Check className="size-3 text-amber-500" />
              <span>Marked fixed by {formatUserId(comment.fixedBy)} at {formatDate(comment.fixedAt)}</span>
            </li>
          )}
          {comment.verifiedBy && (
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>Verified fixed by {formatUserId(comment.verifiedBy)} at {formatDate(comment.verifiedAt)}</span>
            </li>
          )}
          {comment.resolvedBy && (
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="size-3 text-blue-500" />
              <span>Resolved by {formatUserId(comment.resolvedBy)} at {formatDate(comment.resolvedAt)}</span>
            </li>
          )}
          {comment.reopenedBy && (
            <li className="flex flex-col gap-0.5 border-l-2 border-destructive/30 pl-2 mt-1 py-0.5 bg-destructive/5 rounded-r">
              <div className="flex items-center gap-1.5">
                <RotateCcw className="size-3 text-destructive" />
                <span className="font-medium text-destructive">Reopened by {formatUserId(comment.reopenedBy)} at {formatDate(comment.reopenedAt)}</span>
              </div>
              {comment.reopenReason && (
                <p className="text-foreground text-xs italic mt-0.5">
                  &ldquo;{comment.reopenReason}&rdquo;
                </p>
              )}
            </li>
          )}
          {!comment.fixedBy && !comment.verifiedBy && !comment.resolvedBy && !comment.reopenedBy && (
            <li className="text-[11px] italic">No transitions recorded yet.</li>
          )}
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2 justify-end">
        {canMarkFixed && (
          <Button
            size="sm"
            onClick={() => handleAction(() => onMarkFixed(comment.id))}
            disabled={transitioning}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {transitioning ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Check className="size-3.5 mr-1" />}
            Mark Fixed
          </Button>
        )}
        {canVerifyFixed && (
          <Button
            size="sm"
            onClick={() => handleAction(() => onVerifyFixed(comment.id))}
            disabled={transitioning}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {transitioning ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <CheckCircle2 className="size-3.5 mr-1" />}
            Verify Fixed
          </Button>
        )}
        {canResolve && (
          <Button
            size="sm"
            onClick={() => handleAction(() => onResolve(comment.id))}
            disabled={transitioning}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {transitioning ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <ShieldCheck className="size-3.5 mr-1" />}
            Resolve
          </Button>
        )}
        {canReopen && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReopenOpen(true)}
            disabled={transitioning}
          >
            <RotateCcw className="size-3.5 mr-1" />
            Reopen
          </Button>
        )}
      </div>

      <ReopenDialog
        open={reopenOpen}
        onOpenChange={setReopenOpen}
        onConfirm={(reason) =>
          handleAction(async () => {
            await onReopen(comment.id, reason);
            setReopenOpen(false);
          })
        }
        isSubmitting={transitioning}
      />
    </div>
  );
}
