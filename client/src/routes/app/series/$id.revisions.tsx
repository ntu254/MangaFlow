import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileUp, Send, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/layouts/AppShell";
import { useUploadManuscript } from "@/shared/queries/useManuscripts";
import { useSeriesSummary, useSubmitSeries } from "@/shared/queries/useSeries";
import { qk } from "@/shared/queries/keys";
import type { SeriesSummaryManuscript } from "@/shared/api/series";

export const Route = createFileRoute("/app/series/$id/revisions")({
  loader: ({ params }) => {
    return { id: params.id };
  },
  component: RevisionsPage,
});

function RevisionsPage() {
  const { id } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: summary, isLoading } = useSeriesSummary(id);
  const upload = useUploadManuscript();
  const submit = useSubmitSeries();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [note, setNote] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  if (isLoading) {
    return <div className="p-8 text-sm text-foreground/55 animate-pulse">Loading revisions...</div>;
  }

  if (!summary?.series) {
    return <div className="p-8 text-sm text-foreground/55">Series not found.</div>;
  }

  const { series } = summary;
  const manuscripts = [...(summary.manuscripts ?? [])].sort((a, b) => b.version - a.version);
  const current = summary.currentManuscript ?? manuscripts[0] ?? null;
  const canUpload = summary.allowedActions?.canUploadManuscript ?? false;
  const canSubmit = ["DRAFT", "REVISION_REQUESTED"].includes(series.status);
  const isRevision = series.status === "REVISION_REQUESTED";

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadProgress(0);
    await upload.mutateAsync(
      {
        seriesId: series.id,
        file,
        onProgress: setUploadProgress,
        category: "OTHER",
      },
      {
        onSuccess: () => {
          toast.success("Manuscript version uploaded.");
          qc.invalidateQueries({ queryKey: qk.series.summary(series.id) });
          qc.invalidateQueries({ queryKey: qk.series.manuscriptVerify(series.id) });
          setUploadProgress(0);
        },
      },
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    submit.mutate(
      { id: series.id, editorNote: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Submitted to Tantou Editor.");
          setNote("");
          qc.invalidateQueries({ queryKey: qk.series.summary(series.id) });
        },
      },
    );
  };

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <PageHeader
          title={`${series.title} · Revisions`}
          jp="改訂履歴"
          description={
            <Link
              to="/app/series/$id"
              params={{ id: series.id }}
              className="underline-offset-2 hover:underline"
            >
              ← Back to series
            </Link>
          }
        />

        <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/55">
                Submit to Tantou Editor
              </div>
              <h2 className="mt-1 text-lg font-extrabold text-foreground">
                {isRevision ? "Upload revised version and resubmit" : "Finalize internal version"}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-foreground/60">
                Mangaka owns the internal version. Tantou Editor will review, annotate, request
                revision if needed, or approve for the downstream Board and publication flow.
              </p>
            </div>
            <span className="w-fit rounded-md bg-foreground/7 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/65">
              {series.status}
            </span>
          </div>

          {current?.reviewNote && (
            <div className="mt-4 rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              <div className="text-[10px] font-black uppercase tracking-wider">Editor note</div>
              <div className="mt-1">{current.reviewNote}</div>
            </div>
          )}

          <div className="mt-5 rounded-md border border-dashed border-foreground/20 bg-foreground/[0.025] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-600">
                  <FileUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Upload final manuscript</div>
                  <div className="mt-0.5 text-xs text-foreground/55">
                    Upload is available only while the series is Draft or Revision Requested.
                  </div>
                  {upload.isPending && (
                    <div className="mt-2 text-xs font-semibold text-sky-600">
                      Uploading {uploadProgress}%
                    </div>
                  )}
                </div>
              </div>
              <label
                className={`inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-xs font-bold ${
                  canUpload
                    ? "bg-[#061A2B] text-white hover:bg-[#0B2A43] dark:bg-blue-600"
                    : "cursor-not-allowed bg-foreground/10 text-foreground/40"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Choose file
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  disabled={!canUpload || upload.isPending}
                  accept=".pdf,.zip,.png,.jpg,.jpeg,.webp"
                  onChange={(event) => void handleUpload(event.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground/55">
              Note for Tantou Editor
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Explain what changed in this version..."
              className="w-full rounded-md border border-foreground/15 bg-background p-3 text-sm outline-none focus:border-foreground/30"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submit.isPending}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#061A2B] px-4 text-xs font-extrabold text-white hover:bg-[#0B2A43] disabled:cursor-not-allowed disabled:bg-foreground/10 disabled:text-foreground/40 dark:bg-blue-600"
            >
              <Send className="h-3.5 w-3.5" />
              {submit.isPending
                ? "Submitting..."
                : isRevision
                  ? "Resubmit to Editor"
                  : "Submit to Editor"}
            </button>
            {!canSubmit && (
              <p className="text-xs text-foreground/50">
                This series is already past the Mangaka submit stage. Follow review, Board, and
                publication status from the monitor pages.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-foreground/10 bg-card shadow-sm">
          <header className="border-b border-foreground/10 px-5 py-4">
            <h2 className="text-sm font-extrabold text-foreground">Manuscript versions</h2>
            <p className="mt-1 text-xs text-foreground/55">
              Versions are loaded from the series summary API.
            </p>
          </header>
          {manuscripts.length === 0 ? (
            <div className="p-5 text-sm text-foreground/55">
              No manuscript version uploaded yet.
            </div>
          ) : (
            <div className="divide-y divide-foreground/10">
              {manuscripts.map((manuscript) => (
                <VersionRow key={manuscript.id} manuscript={manuscript} />
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground/55">
            Current review state
          </h2>
          <div className="mt-3 text-sm font-bold text-foreground">{series.status}</div>
          <p className="mt-2 text-sm text-foreground/55">
            {series.status === "EDITOR_REVIEW" &&
              "Tantou Editor is reviewing the submitted version."}
            {series.status === "REVISION_REQUESTED" &&
              "Editor requested changes. Upload a revised version and resubmit."}
            {series.status === "BOARD_REVIEW" &&
              "Editor approved and forwarded the series to Board review."}
            {series.status === "ONGOING" && "Approved for production/publication monitoring."}
            {series.status === "DRAFT" && "Prepare the internal manuscript before submission."}
          </p>
        </section>

        <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground/55">
            Downstream monitor
          </h2>
          <div className="mt-3 space-y-3 text-sm">
            <Info
              label="Board"
              value={summary.boardReview?.result ?? summary.boardReview?.status ?? "Pending"}
            />
            <Info
              label="Publication"
              value={`${summary.publicationSummary?.scheduled ?? 0} scheduled / ${summary.publicationSummary?.published ?? 0} published`}
            />
            <Info label="Ranking" value={summary.rankingSummary?.status ?? "Not available"} />
          </div>
          <Link
            to="/app/series/$id/publication"
            params={{ id: series.id }}
            className="mt-4 inline-flex h-8 items-center rounded-md border border-foreground/15 px-3 text-xs font-bold hover:bg-foreground/5"
          >
            Open publication monitor
          </Link>
        </section>
      </aside>
    </div>
  );
}

function VersionRow({ manuscript }: { manuscript: SeriesSummaryManuscript }) {
  return (
    <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-bold text-foreground">Version {manuscript.version}</div>
        <div className="mt-0.5 text-xs text-foreground/55">
          {manuscript.file?.originalName ?? "Manuscript file"} ·{" "}
          {manuscript.uploadedBy?.name ?? "Mangaka"} · {formatDate(manuscript.createdAt)}
        </div>
        {manuscript.reviewNote && (
          <div className="mt-1 text-xs text-foreground/65">{manuscript.reviewNote}</div>
        )}
      </div>
      <span className="w-fit rounded-md bg-foreground/7 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/65">
        {manuscript.status}
      </span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-wider text-foreground/45">
        {label}
      </div>
      <div className="mt-0.5 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
