import { ExternalLink, FileImage, History } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import { ReviewStatusPill } from "@/entities/submission";
import { formatDateTime } from "@/shared/lib/format-date";

export function ChapterPublicationDetailSheet({
  chapter,
  series,
  open,
  onOpenChange,
}: {
  chapter?: Chapter;
  series?: ProductionSeries;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const scheduledAt = chapter?.publication?.scheduledAt ?? chapter?.scheduledAt;
  const publishedAt = chapter?.publication?.publishedAt ?? chapter?.publishedAt;
  const unresolvedNotes = chapter?.reviewNotes.filter((note) => !note.resolved) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 pb-5 pt-7 text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {series?.title ?? "Series"} · Chapter {chapter?.number ?? "—"}
          </p>
          <SheetTitle className="font-serif text-2xl">
            {chapter?.title || "Chapter detail"}
          </SheetTitle>
          {chapter ? (
            <p className="text-xs text-muted-foreground">
              Updated {formatDateTime(chapter.updatedAt)}
            </p>
          ) : null}
        </SheetHeader>

        {chapter ? (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <section className="grid grid-cols-2 gap-3">
              <Metric label="Chapter status">
                <ReviewStatusPill status={chapter.status} />
              </Metric>
              <Metric label="Publication status">
                <span className="font-semibold">
                  {chapter.publication?.status ?? "Not scheduled"}
                </span>
              </Metric>
              <Metric label="Pages">
                <span className="font-semibold">{chapter.pages.length}</span>
              </Metric>
              <Metric label="Revision round">
                <span className="font-semibold">{chapter.revisionRound}</span>
              </Metric>
            </section>

            <section>
              <SectionTitle icon={<History className="size-3.5" />} title="Publication timeline" />
              <dl className="mt-3 divide-y divide-border rounded-md border border-border">
                <TimelineRow label="Assignee" value={chapter.assigneeName || "Unassigned"} />
                <TimelineRow
                  label="Review due"
                  value={chapter.reviewDueAt ? formatDateTime(chapter.reviewDueAt) : "Not set"}
                />
                <TimelineRow
                  label="Scheduled"
                  value={scheduledAt ? formatDateTime(scheduledAt) : "Not scheduled"}
                />
                <TimelineRow
                  label="Published"
                  value={publishedAt ? formatDateTime(publishedAt) : "Not published"}
                />
              </dl>
            </section>

            <section>
              <SectionTitle
                icon={<FileImage className="size-3.5" />}
                title={`Chapter files (${chapter.pages.length})`}
              />
              <div className="mt-3 max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border">
                {chapter.pages.length > 0 ? (
                  chapter.pages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          P.{String(page.pageNumber ?? page.index).padStart(2, "0")} ·{" "}
                          {page.fileName || "Untitled page"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {page.status?.replaceAll("_", " ") ?? "No page status"}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {page.sizeKB ? `${page.sizeKB.toLocaleString()} KB` : "—"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-xs text-muted-foreground">No page files attached.</p>
                )}
              </div>
            </section>

            <section>
              <SectionTitle title={`Open review notes (${unresolvedNotes.length})`} />
              <div className="mt-3 space-y-2">
                {unresolvedNotes.length > 0 ? (
                  unresolvedNotes.map((note) => (
                    <div key={note.id} className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="whitespace-pre-wrap text-xs leading-5">{note.text}</p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {note.authorName} · {formatDateTime(note.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                    No unresolved review notes.
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {chapter ? (
          <SheetFooter className="border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
            <Link
              to="/app/editor/chapters/$chapterId/review"
              params={{ chapterId: chapter.id }}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90"
            >
              Open chapter review <ExternalLink className="size-3.5" />
            </Link>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-xs">{children}</div>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
      {icon}
      {title}
    </h3>
  );
}
