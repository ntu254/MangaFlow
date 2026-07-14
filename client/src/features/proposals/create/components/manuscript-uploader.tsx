import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import type {
  ManuscriptVersion,
  SupportingMaterial,
  SupportingMaterialKind,
} from "@/entities/proposal/model/proposal-types";
import { MATERIAL_KIND_LABEL } from "@/entities/proposal/model/proposal-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";

const MAX_KB = 25 * 1024;
const ACCEPT = ".pdf,.zip,.png,.jpg,.jpeg";

export type DraftManuscript = Pick<
  ManuscriptVersion,
  "fileName" | "fileUrl" | "fileType" | "sizeKB" | "pageCount" | "note"
>;

export type DraftMaterial = Pick<
  SupportingMaterial,
  "kind" | "title" | "fileName" | "fileUrl" | "fileType" | "sizeKB" | "note"
> &
  Partial<Pick<SupportingMaterial, "id" | "uploadedAt">>;

async function fileToDraft(file: File): Promise<DraftManuscript> {
  const uploaded = await uploadFileToR2(file, { folder: "proposals/manuscripts" });
  return {
    fileName: uploaded.filename,
    fileUrl: uploaded.fileUrl,
    fileType: uploaded.mimeType,
    sizeKB: uploaded.sizeKB,
  };
}

const SAMPLE: DraftManuscript = {
  fileName: "sample-manuscript-v1.pdf",
  fileUrl: "https://example.com/sample-manuscript.pdf",
  fileType: "application/pdf",
  sizeKB: 1280,
  pageCount: 28,
  note: "Seeded sample file for MVP workflow validation.",
};

export function ManuscriptUploader({
  value,
  onChange,
  label = "Initial manuscript (required)",
  required = true,
}: {
  value: DraftManuscript | null;
  onChange: (v: DraftManuscript | null) => void;
  label?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handle = async (file: File) => {
    const kb = Math.round(file.size / 1024);
    if (kb > MAX_KB) {
      toast.error(`File ${kb}KB exceeds ${MAX_KB / 1024}MB.`);
      return;
    }
    try {
      onChange(await fileToDraft(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Khong the upload manuscript.");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded border border-dashed border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"
        >
          <Upload className="size-3.5" /> Choose file
        </button>
        <button
          type="button"
          onClick={() => onChange(SAMPLE)}
          className="rounded border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
        >
          Use sample file
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded px-2 py-1 text-xs text-rose-700 hover:underline"
          >
            Clear selection
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handle(f);
            e.target.value = "";
          }}
        />
      </div>
      {value ? (
        <div className="flex items-center gap-3 rounded border border-border bg-background p-3 text-xs">
          <FileText className="size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{value.fileName}</p>
            <p className="text-[10px] text-muted-foreground">
              {value.fileType} · {value.sizeKB} KB
              {value.pageCount ? ` · ${value.pageCount} trang` : ""}
            </p>
          </div>
        </div>
      ) : required ? (
        <p className="text-[10px] text-rose-700">No manuscript yet - required before submit.</p>
      ) : null}
      <Textarea
        rows={2}
        placeholder="Manuscript note (optional)..."
        value={value?.note ?? ""}
        onChange={(e) => value && onChange({ ...value, note: e.target.value })}
        disabled={!value}
      />
    </div>
  );
}

export function MaterialsUploader({
  items,
  onChange,
  allowedKinds,
  maxFiles,
  label,
  required,
}: {
  items: DraftMaterial[];
  onChange: (items: DraftMaterial[]) => void;
  allowedKinds?: SupportingMaterialKind[];
  maxFiles?: number;
  label?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const kindOptions =
    allowedKinds ?? (Object.keys(MATERIAL_KIND_LABEL) as SupportingMaterialKind[]);
  const [kind, setKind] = useState<SupportingMaterialKind>(kindOptions[0] ?? "character");
  const [title, setTitle] = useState("");

  const add = async (file: File) => {
    if (maxFiles != null && items.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} file.`);
      return;
    }
    if (!title.trim()) {
      toast.error("Enter a short material name first.");
      return;
    }
    const kb = Math.round(file.size / 1024);
    if (kb > MAX_KB) {
      toast.error(`File ${kb}KB exceeds ${MAX_KB / 1024}MB.`);
      return;
    }
    try {
      const uploaded = await uploadFileToR2(file, { folder: "proposals/materials" });
      onChange([
        ...items,
        {
          kind,
          title: title.trim(),
          fileName: uploaded.filename,
          fileUrl: uploaded.fileUrl,
          fileType: uploaded.mimeType,
          sizeKB: uploaded.sizeKB,
        },
      ]);
      setTitle("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Khong the upload tai lieu.");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label ?? "Supporting materials (optional)"}
      </Label>
      <div className="flex flex-wrap items-end gap-2 rounded border border-border bg-card/40 p-3">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as SupportingMaterialKind)}
          className="h-9 rounded border border-input bg-background px-2 text-xs"
        >
          {kindOptions.map((k) => (
            <option key={k} value={k}>
              {MATERIAL_KIND_LABEL[k]}
            </option>
          ))}
        </select>
        <Input
          placeholder="Material name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-9 flex-1 min-w-[200px]"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={maxFiles != null && items.length >= maxFiles}
          className="rounded bg-foreground px-3 py-2 text-xs font-semibold text-background"
        >
          + File
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) add(f);
          }}
        />
      </div>
      {required && items.length === 0 ? (
        <p className="text-[10px] text-rose-700">Required before submit.</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="divide-y divide-border rounded border border-border bg-background">
          {items.map((m, i) => (
            <li key={i} className="flex items-center gap-3 p-2 text-xs">
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                {MATERIAL_KIND_LABEL[m.kind]}
              </span>
              <span className="font-semibold">{m.title}</span>
              <span className="text-muted-foreground">
                · {m.fileName} ({m.sizeKB} KB)
              </span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="ml-auto text-rose-700 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
