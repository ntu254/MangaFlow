import { useMemo, useState } from "react";
import { MoreVertical, Plus } from "lucide-react";
import { useChaptersQuery } from "../../api/series-queries";
import type { ProductionSeries } from "@/entities/series/model/series-types";
import { ChapterStatusPill } from "@/entities/chapter";
import { ChapterFormDialog } from "./chapter-form-dialog";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";

export function ChapterTable({
  series,
  onSelect,
  selectedId,
  canCreate,
}: {
  series: ProductionSeries;
  onSelect: (id: string) => void;
  selectedId?: string;
  canCreate: boolean;
}) {
  const { data: chapters = [] } = useChaptersQuery(series.id);
  const [open, setOpen] = useState(false);
  const nextNumber = (chapters[chapters.length - 1]?.number ?? 0) + 1;
  const maxPages = useMemo(
    () => chapters.reduce((m, c) => Math.max(m, c.pages.length), 0),
    [chapters],
  );

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Chapter list
          </p>
          <p className="text-sm">
            {chapters.length} chapter — target {series.targetChapters}
          </p>
        </div>
        {canCreate ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90"
          >
            <Plus className="size-3.5" /> Create chapter
          </button>
        ) : null}
      </div>
      {chapters.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <div>
            <p className="text-sm font-semibold text-foreground">No chapters yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create the first chapter to start the production workspace.
            </p>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90"
            >
              <Plus className="size-3.5" />
              Create first chapter
            </button>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              You do not have permission to create chapters for this series.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Chapter</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Pages</th>
                  <th className="px-3 py-2 text-left">Tasks</th>
                  <th className="px-3 py-2 text-left">Pending Assistant Reviews</th>
                  <th className="px-3 py-2 text-left">Deadline</th>
                  <th className="px-3 py-2 text-left">Last Updated</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((c) => {
                  const active = c.id === selectedId;
                  const due =
                    c.status === "SCHEDULED" || c.status === "PUBLISHED"
                      ? (c.scheduledAt ?? c.publishedAt)
                      : c.draftDueAt;
                  const unresolvedNotes = c.reviewNotes.filter((n) => !n.resolved);
                  const pendingAssistant = unresolvedNotes.filter(
                    (n) => n.authorRole === "assistant",
                  ).length;
                  const targetPages = maxPages || c.pages.length || 0;
                  const pct = targetPages ? Math.round((c.pages.length / targetPages) * 100) : 0;
                  const tasksTotal = c.reviewNotes.length;
                  const tasksDone = c.reviewNotes.filter((n) => n.resolved).length;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelect(c.id)}
                      className={`cursor-pointer border-t border-border ${
                        active ? "bg-muted" : "hover:bg-muted/40"
                      }`}
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-stretch gap-2">
                          <span
                            className={`w-0.5 rounded ${
                              active ? "bg-foreground" : "bg-transparent"
                            }`}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p className="font-semibold">Ch. {String(c.number).padStart(3, "0")}</p>
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                              {c.assigneeName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <p className="max-w-[220px] truncate text-foreground">{c.title}</p>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <ChapterStatusPill status={c.status} />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex min-w-[150px] items-center gap-2">
                          <span className="tabular-nums text-foreground">
                            {c.pages.length} / {targetPages || "—"}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${
                                pct >= 100 ? "bg-emerald-600" : "bg-foreground/70"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-[10px] text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">
                        {tasksTotal > 0 ? `${tasksDone} / ${tasksTotal}` : "0 / 0"}
                      </td>
                      <td className="px-3 py-2 align-top text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          {pendingAssistant > 0 ? (
                            <span className="inline-block size-1.5 rounded-full bg-amber-500" />
                          ) : null}
                          <span
                            className={
                              pendingAssistant > 0 ? "text-amber-700 dark:text-amber-400" : ""
                            }
                          >
                            {pendingAssistant}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-muted-foreground">
                        {formatDate(due)}
                      </td>
                      <td className="px-3 py-2 align-top text-muted-foreground tabular-nums">
                        {formatDateTime(c.updatedAt)}
                      </td>
                      <td className="px-3 py-2 text-right align-top">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(c.id);
                          }}
                          className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Open chapter"
                        >
                          <MoreVertical className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            Showing {chapters.length} / {series.targetChapters} chapters
          </p>
        </>
      )}
      <ChapterFormDialog
        series={series}
        open={open}
        onClose={() => setOpen(false)}
        nextNumber={nextNumber}
      />
    </div>
  );
}
