import type { AnnotationStatus, EditorAnnotation } from "../../model/editor-annotations-store";
import { useEditorAnnotations } from "../../model/editor-annotations-store";
import { formatDateTime } from "@/shared/lib/format-date";

const STATUS_OPTS: AnnotationStatus[] = ["OPEN", "FIXED", "RESOLVED", "REOPENED"];

export function CommentInspector({ annotation }: { annotation?: EditorAnnotation }) {
  const update = useEditorAnnotations((s) => s.updateAnnotation);
  const remove = useEditorAnnotations((s) => s.removeAnnotation);

  if (!annotation) {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-xs text-muted-foreground">
        Chọn pin để xem chi tiết
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4 text-xs">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Author
        </p>
        <p className="text-sm font-semibold">{annotation.authorName}</p>
        <p className="text-[10px] text-muted-foreground">{formatDateTime(annotation.createdAt)}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Comment
        </p>
        <textarea
          value={annotation.text}
          onChange={(e) => update(annotation.id, { text: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded border border-border bg-background p-2 text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Severity
          </span>
          <select
            value={annotation.severity}
            onChange={(e) =>
              update(annotation.id, { severity: e.target.value as EditorAnnotation["severity"] })
            }
            className="w-full rounded border border-border bg-background px-2 py-1"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </span>
          <select
            value={annotation.status}
            onChange={(e) => update(annotation.id, { status: e.target.value as AnnotationStatus })}
            className="w-full rounded border border-border bg-background px-2 py-1"
          >
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={annotation.blocking}
          onChange={(e) => update(annotation.id, { blocking: e.target.checked })}
        />
        <span>Mark blocking</span>
      </label>
      <button
        type="button"
        onClick={() => remove(annotation.id)}
        className="w-full rounded border border-rose-300 px-2 py-1 text-[11px] font-semibold text-rose-900 hover:bg-rose-50"
      >
        Delete
      </button>
    </div>
  );
}
