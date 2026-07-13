import { useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  SubmissionHistoryList,
  SubmissionReviewLoading,
  SubmissionReviewMissing,
  SubmissionReviewWorkspace,
  type SubmissionReviewAction,
} from "@/entities/submission";
import {
  mapApiError,
  useChapterPagesQuery,
  useCommentsQuery,
  useStudioTaskDetailQuery,
  useSubmissionQuery,
  useSubmissionReviewMutation,
  useTaskSubmissionsQuery,
} from "@/features/series";
import { useAuth } from "@/shared/auth";
import { ImageCompare } from "@/shared/ui";

export function EditorSubmissionReview({ submissionId }: { submissionId: string }) {
  const user = useAuth((state) => state.user);
  const navigate = useNavigate();
  const {
    data: submission,
    isLoading: subLoading,
    error: subError,
  } = useSubmissionQuery(submissionId);
  const { data: task } = useStudioTaskDetailQuery(submission?.taskId ?? "");
  const { data: previousSubs = [] } = useTaskSubmissionsQuery(submission?.taskId ?? "");
  const { data: comments = [] } = useCommentsQuery({ taskId: submission?.taskId ?? "" });
  const { data: chapterPages = [] } = useChapterPagesQuery(task?.chapterId ?? "");
  const reviewMutation = useSubmissionReviewMutation();

  const originalPage = chapterPages.find((page) => page.id === task?.pageId);
  const afterIsImage = !submission?.mimeType || submission.mimeType.startsWith("image/");
  const comparison =
    submission && afterIsImage && (submission.fileKey || submission.fileUrl) ? (
      <ImageCompare
        beforeFileKey={originalPage?.fileKey}
        beforeUrl={originalPage?.fileUrl}
        afterFileKey={submission.fileKey}
        afterUrl={submission.fileUrl}
      />
    ) : undefined;

  const taskComments = useMemo(
    () =>
      comments
        .filter((comment) => comment.taskId === submission?.taskId)
        .map((comment) => ({
          id: comment.id,
          authorName: comment.authorName,
          text: comment.text ?? comment.body,
        })),
    [comments, submission],
  );

  const historySubs = useMemo(
    () =>
      previousSubs
        .filter((item) => item.id !== submissionId)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [previousSubs, submissionId],
  );

  const backLink = (
    <Link
      to="/app/editor/review"
      className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--admin-faint)] transition-colors hover:text-[var(--admin-ink)]"
    >
      <ArrowLeft className="size-3.5" />
      Review Queue
    </Link>
  );

  if (!user) return null;

  if (subLoading) {
    return <SubmissionReviewLoading backLink={backLink} />;
  }

  if (subError || !submission) {
    return <SubmissionReviewMissing backLink={backLink} />;
  }

  const isEditorReviewable = submission.status === "MANGAKA_APPROVED";

  function handleReview(action: "approve" | "reject" | "request-revision", reason?: string) {
    reviewMutation.mutate(
      {
        submissionId: submission!.id,
        action: action === "approve" ? "editor-approve" : action,
        reviewerNote: reason,
        taskId: submission!.taskId,
        chapterId: task?.chapterId,
      },
      {
        onSuccess: () => {
          const label =
            action === "approve"
              ? "Submission approved."
              : action === "request-revision"
                ? "Requested changes."
                : "Submission rejected.";
          toast.success(label);
          navigate({ to: "/app/editor/review" });
        },
        onError: (err) => toast.error(mapApiError(err)),
      },
    );
  }

  const actions: SubmissionReviewAction[] = [
    {
      key: "approve",
      label: "Approve Final",
      variant: "primary",
      supported: isEditorReviewable && submission.assistantId !== user.id,
      onAct: (reason) => handleReview("approve", reason),
    },
    {
      key: "request-revision",
      label: "Request Revision",
      variant: "warn",
      requiresReason: true,
      supported: isEditorReviewable,
      onAct: (reason) => handleReview("request-revision", reason),
    },
    {
      key: "reject",
      label: "Reject",
      variant: "danger",
      requiresReason: true,
      supported: isEditorReviewable,
      onAct: (reason) => handleReview("reject", reason),
    },
  ];

  return (
    <SubmissionReviewWorkspace
      backLink={backLink}
      eyebrow="Editor review"
      title={task?.title ?? `Submission ${submission.versionLabel}`}
      subtitle={
        <>
          {submission.assistantId} · v{submission.version} · {submission.taskId.slice(0, 8)}
        </>
      }
      submission={submission}
      comments={taskComments}
      isReviewable={isEditorReviewable}
      actions={actions}
      currentUserId={user.id}
      comparison={comparison}
      history={<SubmissionHistoryList submissions={historySubs} title="Version history" />}
    />
  );
}
