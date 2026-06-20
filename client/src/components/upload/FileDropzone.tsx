import { useCallback, useRef, useState, type DragEvent } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";

export interface DropzoneFileItem {
  id: string;
  name: string;
  size: number;
  type?: string;
  progress?: number; // 0..100, undefined when complete
  error?: string;
}

interface Props {
  accept?: string; // e.g. ".pdf,.png,.jpg,.zip"
  acceptMimes?: string[]; // optional explicit allow list
  maxSizeMb?: number;
  multiple?: boolean;
  files: DropzoneFileItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  disabledReason?: string;
  hint?: string;
  compact?: boolean;
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function FileDropzone({
  accept = ".pdf,.png,.jpg,.jpeg,.zip",
  maxSizeMb = 50,
  multiple = true,
  files,
  onAdd,
  onRemove,
  disabled = false,
  disabledReason,
  hint,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  const allowed = accept.split(",").map((s) => s.trim().toLowerCase());

  const validate = useCallback(
    (incoming: File[]): { ok: File[]; bad: string[] } => {
      const ok: File[] = [];
      const bad: string[] = [];
      for (const f of incoming) {
        const ext = extOf(f.name);
        if (allowed.length && !allowed.includes(ext)) {
          bad.push(`${f.name} — unsupported type`);
          continue;
        }
        if (f.size > maxSizeMb * 1024 * 1024) {
          bad.push(`${f.name} — over ${maxSizeMb}MB`);
          continue;
        }
        ok.push(f);
      }
      return { ok, bad };
    },
    [allowed, maxSizeMb],
  );

  const handle = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const { ok, bad } = validate(Array.from(list));
      setRejected(bad);
      if (ok.length) onAdd(ok);
    },
    [validate, onAdd],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    if (disabled) return;
    handle(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        className={[
          compact
            ? "flex flex-row items-center justify-center gap-3 rounded-lg border border-dashed py-3 px-4 transition-colors text-center"
            : "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          disabled
            ? "cursor-not-allowed border-foreground/10 bg-foreground/[0.02] opacity-60"
            : isOver
              ? "border-primary bg-primary/5"
              : "cursor-pointer border-foreground/15 bg-foreground/[0.02] hover:border-foreground/30 hover:bg-foreground/5",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center justify-center rounded-full bg-foreground/5",
            compact ? "h-8 w-8" : "h-10 w-10",
          ].join(" ")}
        >
          <Upload className={["text-foreground/60", compact ? "h-4 w-4" : "h-5 w-5"].join(" ")} />
        </div>
        <div className={compact ? "flex flex-col items-start" : ""}>
          <div
            className={[
              "font-medium",
              compact ? "text-[12px] text-primary" : "text-[13px] text-foreground/80",
            ].join(" ")}
          >
            {disabled ? (disabledReason ?? "Upload disabled") : "Click to upload or drag and drop"}
          </div>
          <div
            className={
              compact ? "text-[10px] text-foreground/50" : "text-[11px] text-foreground/50"
            }
          >
            {hint ?? `Supported: ${accept.replaceAll(",", ", ")} · up to ${maxSizeMb}MB each`}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          hidden
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {rejected.length > 0 && (
        <div className="rounded-md border border-destructive/20 bg-destructive/[0.04] p-2 text-[12px] text-destructive">
          {rejected.map((r) => (
            <div key={r} className="flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" /> {r}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground/5">
                <FileText className="h-4 w-4 text-foreground/60" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-foreground/90">{f.name}</div>
                <div className="flex items-center gap-2 text-[11px] text-foreground/50">
                  <span>{formatBytes(f.size)}</span>
                  {f.error && <span className="text-destructive">{f.error}</span>}
                </div>
                {typeof f.progress === "number" && f.progress < 100 && (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
