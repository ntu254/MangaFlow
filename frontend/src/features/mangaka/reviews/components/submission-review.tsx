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
import { REGION_TYPE_LABEL, type StudioTask } from "@/entities/series/model/studio-types";
import { buildTaskContext } from "@/entities/task";
import {
  mapApiError,
  useChapterPagesQuery,
  useCommentsQuery,
  useMyChaptersQuery,
  useMySeriesQuery,
  useStudioTaskDetailQuery,
  useStudioTasksQuery,
  useSubmissionQuery,
  useSubmissionReviewMutation,
  useTaskSubmissionsQuery,
} from "@/features/series";
import { useAuth } from "@/shared/auth";
import { ImageCompare } from "@/shared/ui";

export function SubmissionReview({ submissionId }: { submissionId: string }) {
  const user = useAuth((state) => state.user);
  const navigate = useNavigate();
  const { data: chapters = [] } = useMyChaptersQuery();
  const { data: seriesList = [] } = useMySeriesQuery();
  const {
    data: submission,
    isLoading: subLoading,
    error: subError,
  } = useSubmissionQuery(submissionId);
  const { data: taskDetail } = useStudioTaskDetailQuery(submission?.taskId ?? "");
  const { data: tasks = [] } = useStudioTasksQuery({});
  const { data: previousSubs = [] } = useTaskSubmissionsQuery(submission?.taskId ?? "");
  const { data: comments = [] } = useCommentsQuery({ taskId: submission?.taskId ?? "" });
  const reviewMutation = useSubmissionReviewMutation();

  const task = useMemo(
    () => taskDetail ?? tasks.find((item) => item.id === submission?.taskId),
    [taskDetail, tasks, submission],
  );

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

  const ctx = useMemo(() => {
    if (!task) return undefined;
    return buildTaskContext(task as StudioTask, chapters, seriesList);
  }, [task, chapters, seriesList]);

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
      to="/app/mangaka/submissions/review"
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

  const isPending = submission.status === "PENDING";

  function handleReview(action: "approve" | "reject" | "request-revision", reason?: string) {
    reviewMutation.mutate(
      {
        submissionId: submission!.id,
        action,
        reviewerNote: reason,
        taskId: submission!.taskId,
        chapterId: task?.chapterId,
        seriesId: task?.seriesId ?? ctx?.series?.id,
      },
      {
        onSuccess: () => {
          const label =
            action === "approve"
              ? "Submission approved."
              : action === "request-revision"
                ? "Revision requested."
                : "Submission rejected.";
          toast.success(label);
          navigate({ to: "/app/mangaka/submissions/review" });
        },
        onError: (err) => toast.error(mapApiError(err)),
      },
    );
  }

  const actions: SubmissionReviewAction[] = [
    {
      key: "approve",
      label: "Approve",
      variant: "primary",
      supported: isPending && submission.assistantId !== user.id,
      onAct: (reason) => handleReview("approve", reason),
    },
    {
      key: "request-revision",
      label: "Request Revision",
      variant: "warn",
      requiresReason: true,
      supported: isPending,
      onAct: (reason) => handleReview("request-revision", reason),
    },
    {
      key: "reject",
      label: "Reject",
      variant: "danger",
      requiresReason: true,
      supported: isPending,
      onAct: (reason) => handleReview("reject", reason),
    },
  ];

  return (
    <SubmissionReviewWorkspace
      backLink={backLink}
      title={task?.title ?? submission.taskId}
      subtitle={
        <>
          {ctx?.series?.title ?? "-"} · Ch.{ctx?.chapter?.number ?? "-"} ·{" "}
          {REGION_TYPE_LABEL[task?.type ?? "other"]}
        </>
      }
      submission={submission}
      comments={taskComments}
      isReviewable={isPending}
      actions={actions}
      currentUserId={user.id}
      comparison={comparison}
      history={<SubmissionHistoryList submissions={historySubs} title="Revision history" />}
    />
  );
}
