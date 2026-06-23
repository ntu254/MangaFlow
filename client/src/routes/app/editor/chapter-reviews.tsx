import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileStack, LockKeyhole, User } from "lucide-react";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { useEditorChapterReviewQueue } from "@/shared/queries/useChapterReviews";

export const Route = createFileRoute("/app/editor/chapter-reviews")({
  component: EditorChapterReviewQueue,
});

function idOf(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as { id?: string; _id?: string };
    return record.id ?? record._id ?? "";
  }
  return "";
}

function labelOf(value: unknown, key: string, fallback: string) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return typeof record[key] === "string" ? record[key] : fallback;
  }
  return fallback;
}

function EditorChapterReviewQueue() {
  const { data: queue = [], isLoading, isError } = useEditorChapterReviewQueue();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Chapter Reviews"
        jp="チャプターレビュー"
        description="Mangaka-submitted chapter versions awaiting Editor review."
      />

      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        {isLoading && (
          <div className="space-y-3 px-5 py-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-md bg-foreground/5" />
            ))}
          </div>
        )}

        {isError && (
          <div className="px-5 py-8 text-center text-sm text-destructive">
            Unable to load chapter review queue.
          </div>
        )}

        {!isLoading && !isError && queue.length === 0 && (
          <EmptyState
            title="No chapter versions waiting"
            hint="Submitted chapter packages appear here after Mangaka sends v1, v2 or later versions."
            icon={CheckCircle2}
          />
        )}

        {queue.map((item) => {
          const chapter = item.chapterId;
          const series = item.seriesId;
          const submitter =
            typeof item.submittedBy === "object"
              ? item.submittedBy.displayName || item.submittedBy.name || item.submittedBy.email
              : "Mangaka";

          return (
            <Link
              key={item.id}
              to="/app/editor/chapter-reviews/$versionId"
              params={{ versionId: item.id }}
              className="flex items-center gap-4 border-b border-foreground/10 px-5 py-4 transition-colors last:border-b-0 hover:bg-foreground/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                <FileStack className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="text-sm font-bold">
                    {labelOf(series, "title", "Series")} / Ch.{" "}
                    {typeof chapter === "object" ? (chapter.chapterNumber ?? "?") : "?"}
                  </div>
                  <span className="rounded bg-foreground/8 px-2 py-0.5 text-[10px] font-black uppercase text-foreground/60">
                    v{item.version}
                  </span>
                </div>
                <div className="mt-1 text-xs text-foreground/55">
                  {labelOf(chapter, "title", "Chapter")} · {item.pageSnapshots.length} page(s)
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground/50">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {submitter}
                  </span>
                  <span>
                    Submitted{" "}
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "recently"}
                  </span>
                </div>
              </div>
              <div
                className={`flex items-center gap-2 text-[11px] font-bold ${
                  item.isLocked ? "text-emerald-600" : "text-sky-600"
                }`}
              >
                {item.isLocked ? (
                  <>
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Locked
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-3.5 w-3.5" />
                    Review
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
