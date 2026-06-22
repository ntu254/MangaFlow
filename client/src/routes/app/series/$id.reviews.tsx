import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  useReviewQueue,
  useApproveSubmission,
  useEditorApproveSubmission,
  useRequestRevision,
  useTaskSubmissions,
} from "@/shared/queries/useSubmissions";
import { refId, refLabel } from "@/shared/api/submissions";
import { findTask, findChapter, findSeries, findStaff } from "@/entities";
import { usePageStudio } from "@/shared/queries/usePageStudio";
import { useFileObjectUrl } from "@/shared/queries/useFileObjectUrl";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Image as ImageIcon,
  SplitSquareHorizontal,
  Send,
  Eye,
} from "lucide-react";
import { PageAssetImage } from "@/shared/ui/PageAssetImage";
import type { FileAssetRef, PageRef } from "@/shared/api/submissions";

type ReviewViewMode = "split" | "overlay";

type ReviewsSearch = {
  submissionId?: string;
  view?: ReviewViewMode;
};

function isReviewViewMode(value: unknown): value is ReviewViewMode {
  return value === "split" || value === "overlay";
}

export const Route = createFileRoute("/app/series/$id/reviews")({
  validateSearch: (search: Record<string, unknown>): ReviewsSearch => ({
    submissionId: typeof search.submissionId === "string" ? search.submissionId : undefined,
    view: isReviewViewMode(search.view) ? search.view : "split",
  }),
  component: SeriesReviews,
});

function SeriesReviews() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const { data: queueData, isLoading } = useReviewQueue(id);
  const seriesSubmissions = queueData || [];

  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [commentText, setCommentText] = useState("");

  const viewMode = search.view ?? "split";
  const effectiveViewMode = isHoldingOriginal ? "submitted" : viewMode;
  const selectedSub =
    seriesSubmissions.find((s) => s.id === search.submissionId) || seriesSubmissions[0];
  const actualSelectedId = selectedSub?.id || null;

  const approveMutation = useApproveSubmission();
  const editorApproveMutation = useEditorApproveSubmission();
  const requestRevisionMutation = useRequestRevision();

  const updateSearch = (patch: Partial<ReviewsSearch>) => {
    navigate({
      search: (prev) => ({ ...prev, ...patch }),
      replace: false,
    });
  };

  const handleApprove = () => {
    if (!actualSelectedId || !selectedSub) return;
    const isEditorPhase = selectedSub.status === "MANGAKA_APPROVED";
    const mutation = isEditorPhase ? editorApproveMutation : approveMutation;

    mutation.mutate(
      { id: actualSelectedId, note: commentText },
      {
        onSuccess: () => setCommentText(""),
      },
    );
  };

  const handleRequestRevision = () => {
    if (!actualSelectedId) return;
    requestRevisionMutation.mutate(
      { id: actualSelectedId, note: commentText },
      {
        onSuccess: () => setCommentText(""),
      },
    );
  };

  const pageAssets = getPageAssetIds(selectedSub?.pageId);
  const submittedFileAssetId = getFileAssetId(selectedSub?.fileAssetId);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed border-foreground/15 text-[13px] text-foreground/50">
        Loading...
      </div>
    );
  }

  if (seriesSubmissions.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed border-foreground/15 text-[13px] text-foreground/50">
        No pending submissions for this series.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-sm">
      {/* LEFT: Submission List */}
      <div className="flex w-64 flex-col border-r border-foreground/10 bg-card">
        <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
          <h3 className="text-[13px] font-semibold">Submissions</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
            {seriesSubmissions.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {seriesSubmissions.map((sm) => {
            const t = findTask(refId(sm.taskId));
            const taskLabel = t?.type ?? refLabel(sm.taskId, "Task");
            const isSelected = sm.id === actualSelectedId;
            return (
              <button
                key={sm.id}
                onClick={() => updateSearch({ submissionId: sm.id })}
                className={`w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-foreground/5 text-foreground/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold truncate">{taskLabel}</span>
                  {sm.status === "MANGAKA_APPROVED" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <div className="mt-1 text-[11px] opacity-70">
                  {sm.submittedBy.name} &bull; {new Date(sm.createdAt).toLocaleDateString()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CENTER: Viewer */}
      <div className="flex flex-1 flex-col bg-foreground/5 relative">
        <div className="flex h-12 items-center justify-between border-b border-foreground/10 bg-background px-4 shrink-0">
          <div className="text-[12px] font-medium flex items-center gap-2 text-foreground/80">
            <ImageIcon className="w-4 h-4" />
            Comparison Viewer
          </div>
          <div className="flex items-center overflow-hidden rounded-md border border-foreground/15 bg-card">
            <button
              onClick={() => updateSearch({ view: "split" })}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "split"
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/60 hover:bg-foreground/5"
              }`}
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
              Split
            </button>
            <button
              onClick={() => updateSearch({ view: "overlay" })}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors flex items-center gap-1.5 border-l border-foreground/15 ${
                viewMode === "overlay"
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/60 hover:bg-foreground/5"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Toggle Overlay
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {effectiveViewMode === "split" && (
            <div className="flex gap-4 w-full max-w-4xl">
              <div className="flex-1 space-y-2">
                <div className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider text-center">
                  Original
                </div>
                <PageAssetImage
                  originalFileAssetId={pageAssets.originalFileAssetId}
                  workingFileAssetId={pageAssets.workingFileAssetId}
                  thumbnailFileAssetId={pageAssets.thumbnailFileAssetId}
                  mode="original"
                  className="aspect-[3/4] w-full rounded border border-foreground/10 shadow-sm"
                  fit="contain"
                  alt="Original"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-[11px] font-semibold text-primary uppercase tracking-wider text-center">
                  Submitted
                </div>
                <PageAssetImage
                  submittedFileAssetId={submittedFileAssetId}
                  mode="submitted"
                  className="aspect-[3/4] w-full rounded border border-primary/30 shadow-sm"
                  fit="contain"
                  alt="Submitted"
                />
              </div>
            </div>
          )}
          {effectiveViewMode === "overlay" && (
            <div
              className="relative w-full max-w-xl group cursor-pointer"
              onPointerDown={() => setIsHoldingOriginal(true)}
              onPointerUp={() => setIsHoldingOriginal(false)}
              onPointerLeave={() => setIsHoldingOriginal(false)}
            >
              <div className="text-[11px] mb-2 font-semibold text-foreground/50 uppercase tracking-wider text-center">
                Hold to view Original
              </div>
              <PageAssetImage
                submittedFileAssetId={submittedFileAssetId}
                mode="submitted"
                className="aspect-[3/4] w-full rounded border border-foreground/10 shadow-sm"
                imageClassName="transition-all duration-200"
                fit="contain"
                alt="Overlay Viewer"
              />
            </div>
          )}
          {effectiveViewMode === "submitted" && (
            <div className="relative w-full max-w-xl">
              <div className="text-[11px] mb-2 font-semibold text-foreground/50 uppercase tracking-wider text-center">
                Original
              </div>
              <PageAssetImage
                originalFileAssetId={pageAssets.originalFileAssetId}
                workingFileAssetId={pageAssets.workingFileAssetId}
                thumbnailFileAssetId={pageAssets.thumbnailFileAssetId}
                mode="original"
                className="aspect-[3/4] w-full rounded border border-foreground/10 shadow-sm"
                imageClassName="transition-all duration-200"
                fit="contain"
                alt="Original"
              />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Sidebar / Actions */}
      {selectedSub && (
        <div className="flex w-72 flex-col border-l border-foreground/10 bg-card">
          <div className="border-b border-foreground/10 px-4 py-4">
            <h4 className="text-[14px] font-bold">Feedback & Approval</h4>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-foreground/60">
              <span className="inline-flex items-center rounded-full bg-foreground/10 px-2 py-0.5">
                {selectedSub.status === "MANGAKA_APPROVED" ? "Approved" : "Pending Review"}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 mb-2">History & Comments</h5>
            <div className="space-y-3">
              {submissionsHistory.length === 0 ? (
                <div className="text-[11px] text-foreground/45 italic">No comment history.</div>
              ) : (
                [...submissionsHistory].reverse().map((h: any) => (
                  <div key={h.id} className="space-y-2 border-b border-foreground/5 pb-3 last:border-b-0">
                    <div className="flex gap-2">
                      <div className="h-6 w-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {h.submittedBy?.name?.[0] || "A"}
                      </div>
                      <div className="rounded-xl rounded-tl-none bg-foreground/5 px-3 py-2 text-[12px] flex-1">
                        <div>{h.resultText || "Submitted version for review."}</div>
                        <div className="mt-1 text-[10px] opacity-50">
                          {h.submittedBy?.name || "Assistant"} &bull; v{h.version} &bull; {new Date(h.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {h.reviewerNote && (
                      <div className="flex gap-2 pl-4">
                        <div className="h-6 w-6 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          R
                        </div>
                        <div className="rounded-xl rounded-tl-none bg-amber-500/5 px-3 py-2 text-[12px] flex-1 border border-amber-500/10">
                          <div>{h.reviewerNote}</div>
                          <div className="mt-1 text-[10px] opacity-50 text-amber-600 dark:text-amber-400">
                            Reviewer Feedback &bull; {h.status.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-foreground/10 p-3 bg-background/50">
            <div className="relative mb-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write feedback..."
                className="w-full resize-none rounded-md border border-foreground/15 bg-background p-2.5 pr-10 text-[12px] placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
              />
              <button className="absolute bottom-2 right-2 rounded-md p-1.5 text-primary hover:bg-primary/10 transition-colors">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRequestRevision}
                disabled={requestRevisionMutation.isPending || approveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 py-2 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Request Changes
              </button>
              <button
                onClick={handleApprove}
                disabled={
                  approveMutation.isPending ||
                  editorApproveMutation.isPending ||
                  requestRevisionMutation.isPending
                }
                className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-[#061A2B] py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-blue-600 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getFileAssetId(fileAsset: FileAssetRef | undefined): string | undefined {
  if (!fileAsset) return undefined;
  if (typeof fileAsset === "string") return fileAsset;
  return fileAsset.id ?? fileAsset._id;
}

function getPageAssetIds(page: PageRef | undefined) {
  if (!page || typeof page === "string") {
    return {};
  }
  return {
    originalFileAssetId: getFileAssetId(page.originalFileAssetId),
    workingFileAssetId: getFileAssetId(page.workingFileAssetId),
    thumbnailFileAssetId: getFileAssetId(page.thumbnailFileAssetId),
  };
}
