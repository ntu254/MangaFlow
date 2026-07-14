import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioTask } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import type { TaskReferenceFile } from "@/entities/series/model/studio-types";
import { FileText, Layers, Paperclip } from "lucide-react";

export function TaskBriefPanel({
  task,
  chapter,
  series,
  references,
}: {
  task: StudioTask;
  chapter?: Chapter;
  series?: ProductionSeries;
  references: TaskReferenceFile[];
}) {
  const accepted = ["PSD", "CLIP", "PNG ≥ 300 DPI"];
  const checklist = [
    "Stay within the marked region",
    "Keep the proportions and style of the previous chapter",
    "Ensure the output file uses the correct format",
  ];
  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <Header icon={<FileText className="size-3.5" />} title="Task type" />
      <p className="-mt-2 text-xs">
        <span className="rounded bg-muted px-1.5 py-0.5 font-semibold">
          {REGION_TYPE_LABEL[task.type]}
        </span>
      </p>

      <Header icon={<FileText className="size-3.5" />} title="Mangaka notes / Instructions" />
      <p className="-mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
        {task.instructions}
      </p>

      <Header icon={<Layers className="size-3.5" />} title="Region" />
      <ul className="-mt-2 space-y-1 text-[11px] text-muted-foreground">
        <li>
          Series: <span className="font-semibold text-foreground">{series?.title ?? "—"}</span>
        </li>
        <li>
          Chapter:{" "}
          <span className="font-semibold text-foreground">
            Ch. {String(chapter?.number ?? 0).padStart(3, "0")}
          </span>
        </li>
        <li>
          Region type:{" "}
          <span className="font-semibold text-foreground">{REGION_TYPE_LABEL[task.type]}</span>
        </li>
      </ul>

      <Header
        icon={<Paperclip className="size-3.5" />}
        title={`References (${references.length})`}
      />
      {references.length === 0 ? (
        <p className="-mt-2 text-[11px] text-muted-foreground">No references attached.</p>
      ) : (
        <ul className="-mt-2 space-y-1.5">
          {references.slice(0, 6).map((m, index) => (
            <li
              key={m.id ?? m.fileKey ?? `${m.title ?? m.fileName ?? "reference"}-${index}`}
              className="flex items-start gap-2 rounded border border-border bg-background/60 p-2 text-[11px]"
            >
              <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {m.kind ?? "reference"}
              </span>
              <span className="truncate font-semibold">
                {m.title ?? m.name ?? m.fileName ?? "Reference file"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Header icon={<FileText className="size-3.5" />} title="Expected output" />
      <ul className="-mt-2 space-y-1 text-[11px] text-muted-foreground">
        {accepted.map((a) => (
          <li key={a}>• {a}</li>
        ))}
      </ul>

      <Header icon={<FileText className="size-3.5" />} title="Requirements checklist" />
      <ul className="-mt-2 space-y-1 text-[11px] text-muted-foreground">
        {checklist.map((c) => (
          <li key={c} className="flex items-start gap-1.5">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-foreground" /> {c}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Header({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {icon}
      {title}
    </p>
  );
}
