import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  FileStack,
  Loader2,
  LockKeyhole,
  MessageSquarePlus,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/layouts/AppShell";
import {
  useApproveChapterVersion,
  useChapterVersionDetail,
  useCreateChapterReviewAnnotation,
  usePatchChapterReviewAnnotation,
  useRequestChapterVersionRevision,
} from "@/shared/queries/useChapterReviews";
import { useFileObjectUrl } from "@/shared/queries/useFileObjectUrl";

export const Route = createFileRoute("/app/editor/chapter-reviews/$versionId")({
  component: EditorChapterReviewDetail,
});

function EditorChapterReviewDetail() {
  const { versionId } = Route.useParams();
  const router = useRouter();
  const { data, isLoading, isError } = useChapterVersionDetail(versionId);
  const approve = useApproveChapterVersion(versionId);
  const requestRevision = useRequestChapterVersionRevision(versionId);
  const createAnnotation = useCreateChapterReviewAnnotation(versionId);
  const patchAnnotation = usePatchChapterReviewAnnotation(versionId);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [annotationBody, setAnnotationBody] = useState("");

  const version = data?.version;
  const pages = version?.pageSnapshots ?? [];
  const activePage = useMemo(
    () => pages.find((page) => page.pageId === activePageId) ?? pages[0],
    [activePageId, pages],
  );
  const activePageAnnotations = (data?.annotations ?? []).filter(
    (annotation) => !activePage || annotation.pageId === activePage.pageId,
  );
  const blockingOpen = (data?.annotations ?? []).filter(
    (annotation) => annotation.status === "OPEN" && annotation.isBlocking,
  ).length;
  const canAct = version?.status === "SUBMITTED" && !version.isLocked;
  const overallReview = note.trim();
  const canSubmitDecision = canAct && overallReview.length > 0;

  useEffect(() => {
    if (version?.reviewerNote) setNote(version.reviewerNote);
  }, [version?.reviewerNote]);

  function submitRevision() {
    if (!canSubmitDecision) return;
    requestRevision.mutate(
      { reviewerNote: overallReview },
      { onSuccess: () => router.navigate({ to: "/app/editor/chapter-reviews" }) },
    );
  }

  function submitApprove() {
    if (!canSubmitDecision) return;
    approve.mutate({ reviewerNote: overallReview });
  }

  function submitAnnotation() {
    if (!annotationBody.trim() || !activePage) return;
    createAnnotation.mutate(
      { pageId: activePage.pageId, body: annotationBody.trim(), isBlocking: true },
      { onSuccess: () => setAnnotationBody("") },
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-foreground/55">Loading chapter version...</div>
    );
  }

  if (isError || !version) {
    return (
      <div className="p-8 text-center text-sm text-destructive">Unable to load chapter review.</div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4">
        <Link
          to="/app/editor/chapter-reviews"
          className="inline-flex items-center gap-2 text-xs font-bold text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to chapter reviews
        </Link>
      </div>

      <PageHeader
        title={`Chapter version v${version.version}`}
        jp="チャプターバージョン"
        description="Review this version snapshot package, leave version-specific annotations, then approve or request revision."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-md border border-foreground/10 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <FileStack className="h-4 w-4 text-sky-600" />
              Page snapshot package
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={version.status} />
              {version.isLocked && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-600">
                  <LockKeyhole className="h-3 w-3" />
                  Locked
                </span>
              )}
            </div>
          </div>

          <div className="grid min-h-[640px] lg:grid-cols-[1fr_150px]">
            <div className="flex min-h-[520px] items-center justify-center bg-foreground/[0.035] p-4">
              {activePage ? (
                <SnapshotImage page={activePage} />
              ) : (
                <div>No pages in this version.</div>
              )}
            </div>
            <aside className="grid max-h-[220px] grid-cols-4 gap-2 overflow-y-auto border-t border-foreground/10 p-3 lg:max-h-none lg:grid-cols-1 lg:border-l lg:border-t-0">
              {pages.map((page) => (
                <button
                  key={page.pageId}
                  type="button"
                  onClick={() => setActivePageId(page.pageId)}
                  className={`relative aspect-[3/4] overflow-hidden rounded-md border bg-foreground/5 ${
                    activePage?.pageId === page.pageId
                      ? "border-sky-500 ring-2 ring-sky-500/25"
                      : "border-foreground/10"
                  }`}
                >
                  <SnapshotThumb page={page} />
                  <span className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-black text-white">
                    {page.pageNumber}
                  </span>
                </button>
              ))}
            </aside>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-md border border-foreground/10 bg-card p-4">
            <h3 className="text-sm font-bold">Decision</h3>
            <p className="mt-1 text-xs text-foreground/55">
              Overall review is required before approval or revision request.
            </p>
            <label className="mt-3 block text-[11px] font-black uppercase tracking-wider text-foreground/55">
              Overall review
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={!canAct}
              className="mt-1.5 min-h-28 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:opacity-60"
              placeholder="Write the overall review for this version"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={submitRevision}
                disabled={!canSubmitDecision || requestRevision.isPending}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-foreground/15 px-3 text-xs font-bold text-foreground/70 hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {requestRevision.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Revision
              </button>
              <button
                type="button"
                onClick={submitApprove}
                disabled={!canSubmitDecision || blockingOpen > 0 || approve.isPending}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approve.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve
              </button>
            </div>
            {blockingOpen > 0 && (
              <div className="mt-2 text-xs font-medium text-amber-600">
                {blockingOpen} blocking annotation(s) still open.
              </div>
            )}
            {canAct && !overallReview && (
              <div className="mt-2 text-xs font-medium text-foreground/50">
                Enter an overall review to enable a decision.
              </div>
            )}
          </section>

          <section className="rounded-md border border-foreground/10 bg-card p-4">
            <h3 className="text-sm font-bold">
              Annotations for page {activePage?.pageNumber ?? "-"}
            </h3>
            <div className="mt-3 flex gap-2">
              <input
                value={annotationBody}
                onChange={(event) => setAnnotationBody(event.target.value)}
                disabled={!canAct}
                className="min-w-0 flex-1 rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:opacity-60"
                placeholder="Add blocking note"
              />
              <button
                type="button"
                onClick={submitAnnotation}
                disabled={!canAct || !annotationBody.trim() || createAnnotation.isPending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Add annotation"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {activePageAnnotations.length === 0 ? (
                <div className="rounded-md bg-foreground/5 px-3 py-4 text-center text-xs text-foreground/50">
                  No annotations on this page.
                </div>
              ) : (
                activePageAnnotations.map((annotation) => (
                  <div key={annotation.id} className="rounded-md border border-foreground/10 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground/85">{annotation.body}</p>
                      <span className="rounded bg-foreground/8 px-2 py-0.5 text-[10px] font-bold uppercase text-foreground/55">
                        {annotation.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-foreground/50">
                      <span>{annotation.isBlocking ? "Blocking" : "Note"}</span>
                      {annotation.status !== "RESOLVED" && (
                        <button
                          type="button"
                          onClick={() =>
                            patchAnnotation.mutate({
                              annotationId: annotation.id,
                              input: { status: "RESOLVED" },
                            })
                          }
                          className="font-bold text-emerald-600 hover:underline"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SnapshotImage({ page }: { page: { fileAssetId: string; pageNumber: number } }) {
  const { data: url, isLoading } = useFileObjectUrl(page.fileAssetId);
  if (isLoading)
    return <div className="h-[520px] w-full animate-pulse rounded-md bg-foreground/5" />;
  if (!url) return <div className="text-sm text-foreground/50">No preview asset available.</div>;
  return (
    <img
      src={url}
      alt={`Page ${page.pageNumber}`}
      className="max-h-[72vh] max-w-full rounded-md object-contain shadow-sm"
    />
  );
}

function SnapshotThumb({ page }: { page: { thumbnailFileAssetId?: string; fileAssetId: string } }) {
  const { data: url, isLoading } = useFileObjectUrl(page.thumbnailFileAssetId ?? page.fileAssetId);
  if (isLoading) return <div className="absolute inset-0 animate-pulse bg-foreground/5" />;
  if (!url)
    return (
      <div className="absolute inset-0 flex items-center justify-center text-[9px] text-foreground/40">
        No image
      </div>
    );
  return <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />;
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "APPROVED"
      ? "bg-emerald-500/10 text-emerald-600"
      : status === "REVISION_REQUESTED"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-sky-500/10 text-sky-600";
  return (
    <span className={`rounded px-2 py-1 text-[11px] font-black uppercase ${cls}`}>{status}</span>
  );
}
