import { formatDateTime } from "@/shared/lib/format-date";
import type { Chapter } from "@/entities/series/model/series-types";

export function ReviewNotes({ chapter }: { chapter: Chapter }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Review notes
      </p>
      {chapter.reviewNotes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No review notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {chapter.reviewNotes.map((n) => (
            <li key={n.id} className="rounded border border-border bg-background p-3 text-xs">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>
                  {n.authorName} · {n.authorRole}
                </span>
                <span>{formatDateTime(n.createdAt)}</span>
              </div>
              <p className="whitespace-pre-line">{n.text}</p>
              {n.resolved ? <p className="mt-1 text-emerald-700">Resolved</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
