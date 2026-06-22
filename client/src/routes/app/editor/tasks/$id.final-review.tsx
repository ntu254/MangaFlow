import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/layouts/AppShell";
import { useFileObjectUrl } from "@/shared/queries/useFileObjectUrl";
import { useTaskSubmissions } from "@/shared/queries/useSubmissions";
import {
  useEditorApproveTaskSubmission,
  useEditorGetTask,
  useEditorRejectTaskSubmission,
  useEditorRequestTaskSubmissionRevision,
} from "@/shared/queries/useEditorReview";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileCheck2,
  FileText,
  Loader2,
  User,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

export const Route = createFileRoute("/app/editor/tasks/$id/final-review")({
  component: TaskFinalReviewDetail,
});

function TaskFinalReviewDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [comment, setComment] = useState("");

  const { data: task, isLoading: isTaskLoading } = useEditorGetTask(id);
  const { data: submissions = [], isLoading: isSubsLoading } = useTaskSubmissions(id);

  const approveMutation = useEditorApproveTaskSubmission(id);
  const rejectMutation = useEditorRejectTaskSubmission(id);
  const requestRevisionMutation = useEditorRequestTaskSubmissionRevision(id);

  const isPending =
    approveMutation.isPending || rejectMutation.isPending || requestRevisionMutation.isPending;

  const isLoading = isTaskLoading || isSubsLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground/40" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center text-sm text-foreground/55">
        Task not found or permission denied.
      </div>
    );
  }

  // Submissions are sorted by version desc, so index 0 is the latest one
  const latestSub = submissions[0];

  const handleAction = async (action: "approve" | "revision" | "reject") => {
    if (!latestSub) {
      toast.error("No submission found to review.");
      return;
    }

    const trimmedComment = comment.trim();

    if ((action === "revision" || action === "reject") && !trimmedComment) {
      toast.error(
        `A comment is required to ${action === "revision" ? "request revision" : "reject"} the submission.`,
      );
      return;
    }

    try {
      if (action === "approve") {
        await approveMutation.mutateAsync({
          submissionId: latestSub.id,
          note: trimmedComment || undefined,
        });
      } else if (action === "revision") {
        await requestRevisionMutation.mutateAsync({
          submissionId: latestSub.id,
          note: trimmedComment,
        });
      } else if (action === "reject") {
        await rejectMutation.mutateAsync({
          submissionId: latestSub.id,
          note: trimmedComment,
        });
      }
      router.navigate({ to: "/app/editor/final-reviews" });
    } catch {
      // Errors are handled by query callbacks
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/app/editor/final-reviews"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-foreground/10 hover:bg-foreground/5 text-foreground/75"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs text-foreground/50">Back to final review queue</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Columns - Task Info and Submission Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Task Info */}
          <div className="rounded-md border border-foreground/10 bg-card p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                  {task.priority}
                </span>
                <span className="text-xs text-foreground/45">Task Details</span>
              </div>
              <h2 className="mt-2 text-xl font-bold">{task.title}</h2>
              {task.description && (
                <p className="mt-2 text-sm text-foreground/75 whitespace-pre-wrap">
                  {task.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-foreground/5 pt-4 text-xs">
              <div className="space-y-1">
                <div className="text-foreground/45 font-medium">Assigned To</div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <User className="h-3.5 w-3.5 text-foreground/55" />
                  {typeof task.assignedTo === "object" ? task.assignedTo?.name : "Assistant"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-foreground/45 font-medium">Due Date</div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-foreground/55" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Latest Submission Asset Preview */}
          {latestSub ? (
            <div className="space-y-4">
              <div className="rounded-md border border-foreground/10 bg-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-foreground/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold">Latest Submission (v{latestSub.version})</h3>
                    <p className="text-[10px] text-foreground/45">
                      Submitted on {new Date(latestSub.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                    {latestSub.status}
                  </span>
                </div>

                {latestSub.resultText && (
                  <div className="rounded bg-foreground/[0.02] border border-foreground/5 p-4 text-sm whitespace-pre-wrap">
                    {latestSub.resultText}
                  </div>
                )}

                {latestSub.fileAssetId && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-md border border-foreground/10 px-3 py-2 bg-foreground/[0.01]">
                      <FileText className="h-4 w-4 text-foreground/55" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">
                          {typeof latestSub.fileAssetId === "object"
                            ? latestSub.fileAssetId?.originalName
                            : "Submitted File"}
                        </div>
                      </div>
                    </div>

                    <SubmissionImagePreview
                      fileAssetId={
                        typeof latestSub.fileAssetId === "object"
                          ? latestSub.fileAssetId?.id || latestSub.fileAssetId?._id
                          : latestSub.fileAssetId
                      }
                    />
                  </div>
                )}
              </div>

              {/* Submission History */}
              {submissions.length > 1 && (
                <div className="rounded-md border border-foreground/10 bg-card p-6 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/50">
                    Submission History
                  </h4>
                  <div className="divide-y divide-foreground/5">
                    {submissions.slice(1).map((sub: any) => (
                      <div
                        key={sub.id}
                        className="py-2.5 flex items-start justify-between text-xs last:pb-0"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground/80">
                            Version {sub.version}
                          </div>
                          {sub.resultText && (
                            <div className="text-foreground/60 italic">
                              &ldquo;{sub.resultText}&rdquo;
                            </div>
                          )}
                          {sub.reviewerNote && (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400">
                              Feedback: {sub.reviewerNote}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-[10px] text-foreground/45">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </div>
                          <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold bg-foreground/5 text-foreground/65">
                            {sub.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-foreground/10 p-12 text-center bg-card">
              <FolderOpen className="mx-auto h-8 w-8 text-foreground/30" />
              <h3 className="mt-2 text-sm font-semibold">No Submissions yet</h3>
              <p className="mt-1 text-xs text-foreground/45">
                The assistant has not uploaded any results for this task.
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <div className="rounded-md border border-foreground/10 bg-card p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold">Review Decision</h3>
              <p className="text-xs text-foreground/45">
                Decide if the work meets standard quality guidelines.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground/70">
                Review Notes / Feedback
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Provide details on revision requirements or notes for approval..."
                rows={5}
                className="w-full rounded-md border border-foreground/15 bg-background p-3 text-sm focus:border-foreground/30 outline-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleAction("approve")}
                disabled={isPending || !latestSub}
                className="w-full flex items-center justify-center gap-1.5 h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Approve (Final Approve)
              </button>

              <button
                onClick={() => handleAction("revision")}
                disabled={isPending || !latestSub}
                className="w-full flex items-center justify-center gap-1.5 h-10 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow disabled:opacity-50 transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
                Request Revision
              </button>

              <button
                onClick={() => handleAction("reject")}
                disabled={isPending || !latestSub}
                className="w-full flex items-center justify-center gap-1.5 h-10 rounded-md bg-destructive hover:bg-destructive/95 text-white text-xs font-bold shadow disabled:opacity-50 transition-colors"
              >
                <AlertCircle className="h-4 w-4" />
                Reject Submission
              </button>
            </div>

            <div className="text-[11px] text-foreground/45 border-t border-foreground/5 pt-3 space-y-1.5">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Revision / Rejection requires review feedback.
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Approval will release task payment calculation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionImagePreview({ fileAssetId }: { fileAssetId: string | undefined }) {
  const { data: url, isLoading } = useFileObjectUrl(fileAssetId);
  const [zoom, setZoom] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-foreground/10 bg-foreground/5 animate-pulse text-xs text-foreground/45">
        Loading submission preview image...
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-foreground/10 bg-foreground/5 text-xs text-foreground/45">
        No image file preview available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-foreground/60">Asset Visualizer:</div>
      <div
        onClick={() => setZoom(!zoom)}
        className={`relative overflow-hidden rounded-md border border-foreground/10 bg-black flex items-center justify-center cursor-pointer transition-all ${
          zoom ? "max-h-none h-auto py-4" : "max-h-96 h-96"
        }`}
      >
        <img
          src={url}
          alt="Submission Asset"
          className={`object-contain max-w-full h-full max-h-[70vh] transition-transform ${zoom ? "" : "hover:scale-105"}`}
        />
        {!zoom && (
          <div className="absolute bottom-2 right-2 rounded bg-black/60 backdrop-blur text-[10px] text-white font-bold px-2 py-1 select-none">
            Click to expand
          </div>
        )}
      </div>
    </div>
  );
}
