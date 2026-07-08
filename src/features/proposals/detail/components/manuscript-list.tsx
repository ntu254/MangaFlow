import { FileText, Download } from "lucide-react";
import type { ManuscriptVersion } from "@/entities/proposal/model/proposal-types";

export function ManuscriptList({
  manuscripts,
  onView,
}: {
  manuscripts: ManuscriptVersion[];
  onView?: (m: ManuscriptVersion) => void;
}) {
  if (manuscripts.length === 0)
    return (
      <p className="rounded border border-dashed border-border bg-card/40 p-4 text-xs text-muted-foreground">
        Chưa có bản thảo nào.
      </p>
    );
  const sorted = [...manuscripts].sort((a, b) => b.version - a.version);
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card/40">
      {sorted.map((m, idx) => (
        <li key={m.id} className="flex items-start gap-3 p-3 text-xs">
          <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-serif text-base font-semibold">v{m.version}</span>
              {idx === 0 ? (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                  Current
                </span>
              ) : null}
              <span className="font-mono text-[10px] text-muted-foreground">
                {m.fileName} · {m.sizeKB} KB{m.pageCount ? ` · ${m.pageCount}p` : ""}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {m.uploadedByName} · {new Date(m.uploadedAt).toLocaleString("vi-VN")}
              </span>
            </div>
            {m.note ? <p className="mt-1 text-foreground/80">{m.note}</p> : null}
            <div className="mt-2 flex gap-2">
              {onView ? (
                <button
                  onClick={() => onView(m)}
                  className="rounded border border-border bg-background px-2 py-0.5 text-[10px] font-semibold hover:bg-muted"
                >
                  Xem
                </button>
              ) : null}
              <a
                href={m.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] font-semibold hover:bg-muted"
              >
                <Download className="size-3" /> Mở file
              </a>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
