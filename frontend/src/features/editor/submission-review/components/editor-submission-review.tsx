import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  SubmissionHistoryList,
  SubmissionReviewLoading,
  SubmissionReviewMissing,
  SubmissionReviewWorkspace,
} from "@/entities/submission";
import {
  useChapterPagesQuery,
  useCommentsQuery,
  useStudioTaskDetailQuery,
  useSubmissionQuery,
  useTaskSubmissionsQuery,
} from "@/features/series";
import { useAuth } from "@/shared/auth";
import { ImageCompare } from "@/shared/ui";

export function EditorSubmissionReview({ submissionId }: { submissionId: string }) {
  const user = useAuth((state) => state.user);
  const {
    data: submission,
    isLoading: subLoading,
    error: subError,
  } = useSubmissionQuery(submissionId);
  const { data: task } = useStudioTaskDetailQuery(submission?.taskId ?? "");
  const { data: previousSubs = [] } = useTaskSubmissionsQuery(submission?.taskId ?? "");
  const { data: comments = [] } = useCommentsQuery({ taskId: submission?.taskId ?? "" });
  const { data: chapterPages = [] } = useChapterPagesQuery(task?.chapterId ?? "");

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
      className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
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

  const chapterReviewLink = task?.chapterId ? (
    <Link
      to="/app/editor/chapters/$chapterId/review"
      params={{ chapterId: task.chapterId }}
      className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
    >
      Open consolidated Chapter Review
    </Link>
  ) : null;

  return (
    <SubmissionReviewWorkspace
      backLink={backLink}
      title={task?.title ?? `Submission ${submission.versionLabel}`}
      subtitle={
        <>
          {submission.assistantId} · v{submission.version} · {submission.taskId.slice(0, 8)}
        </>
      }
      submission={submission}
      comments={taskComments}
      isReviewable={false}
      actions={[]}
      currentUserId={user.id}
      comparison={comparison}
      history={
        <div className="space-y-3">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            Tantou no longer approves Assistant submissions directly. Review the consolidated
            Chapter/Page snapshot instead.
            {chapterReviewLink ? <div className="mt-2">{chapterReviewLink}</div> : null}
          </div>
          <SubmissionHistoryList submissions={historySubs} title="Version history" />
        </div>
      }
    />
  );
}
