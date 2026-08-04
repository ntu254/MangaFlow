import { useRef, useState } from "react";
import { FileText, Upload, X, Paperclip, CheckCircle2, FileArchive, Image as ImageIcon, Sparkles, Loader2, Eye, ExternalLink } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useResolvedFileUrl } from "@/shared/lib/use-resolved-file-url";

const MAX_KB = 25 * 1024;
const ACCEPT = ".pdf,.zip,.png,.jpg,.jpeg";

export type DraftManuscript = Pick<
  ManuscriptVersion,
  "fileKey" | "fileName" | "fileUrl" | "fileType" | "sizeKB" | "pageCount" | "note"
>;

export type DraftMaterial = Pick<
  SupportingMaterial,
  "kind" | "title" | "fileKey" | "fileName" | "fileUrl" | "fileType" | "sizeKB" | "note"
> &
  Partial<Pick<SupportingMaterial, "id" | "uploadedAt">>;

async function fileToDraft(file: File): Promise<DraftManuscript> {
  const uploaded = await uploadFileToR2(file, { folder: "proposals/manuscripts" });
  return {
    fileKey: uploaded.fileKey,
    fileName: uploaded.filename,
    fileUrl: uploaded.fileUrl,
    fileType: uploaded.mimeType,
    sizeKB: uploaded.sizeKB,
  };
}

function getFileIcon(type?: string, name?: string) {
  const t = (type || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (t.includes("pdf") || n.endsWith(".pdf")) return <FileText className="size-5 text-red-500" />;
  if (t.includes("zip") || n.endsWith(".zip")) return <FileArchive className="size-5 text-amber-500" />;
  if (t.includes("image") || n.match(/\.(jpg|jpeg|png|webp)$/)) return <ImageIcon className="size-5 text-blue-500" />;
  return <Paperclip className="size-5 text-primary" />;
}

export function ManuscriptUploader({
  value,
  onChange,
  label = "Sample manuscript (required)",
  required = true,
}: {
  value: DraftManuscript | null;
  onChange: (v: DraftManuscript | null) => void;
  label?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handle = async (file: File) => {
    const kb = Math.round(file.size / 1024);
    if (kb > MAX_KB) {
      toast.error(`File size (${(kb / 1024).toFixed(1)}MB) exceeds 25MB limit.`);
      return;
    }
    try {
      setIsUploading(true);
      const draft = await fileToDraft(file);
      onChange(draft);
      toast.success("Manuscript uploaded successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload manuscript.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
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

      {value ? (
        <div className="space-y-3">
          <div className="group relative flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-2xs backdrop-blur-xs transition-all hover:border-primary/40">
            <div className="grid size-10 place-items-center rounded-lg bg-muted/60 border border-border/60 shrink-0">
              {getFileIcon(value.fileType, value.fileName)}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-bold text-foreground">{value.fileName}</p>
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">
                {(value.sizeKB / 1024).toFixed(2)} MB · {value.fileType || "Document"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewOpen(true)}
                className="h-8 rounded-lg text-xs gap-1 border-border/80 hover:bg-muted font-semibold"
              >
                <Eye className="size-3.5 text-primary" />
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="h-8 rounded-lg text-xs"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(null)}
                className="size-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <Textarea
            rows={2}
            placeholder="Add notes for editors regarding this manuscript (e.g. key scenes, draft version, content warnings)..."
            value={value?.note ?? ""}
            onChange={(e) => onChange({ ...value, note: e.target.value })}
            className="rounded-xl text-xs bg-background/50 border-border/80 focus:bg-background"
          />

          <FilePreviewModal
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            fileKey={value.fileKey}
            fileUrl={value.fileUrl}
            fileName={value.fileName}
            fileType={value.fileType}
            title="Sample Manuscript Preview"
          />
        </div>
      ) : (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          className="group flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-5 text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted/40 hover:text-foreground"
        >
          {isUploading ? (
            <div className="flex items-center gap-2.5 text-xs font-bold text-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              Uploading manuscript...
            </div>
          ) : (
            <>
              <div className="grid size-9 place-items-center rounded-xl bg-background shadow-2xs border border-border/60 transition-transform group-hover:scale-105">
                <Upload className="size-4 text-primary" />
              </div>
              <div className="text-center space-y-0.5">
                <span className="block text-xs font-bold text-foreground">Click to upload manuscript</span>
                <span className="block text-[10px] text-muted-foreground">
                  Accepted formats: .pdf, .zip, .png, .jpg (Max 25MB)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {!value && required && (
        <p className="text-[10px] font-medium text-rose-500">Sample manuscript file is required before submitting.</p>
      )}
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
  const [isUploading, setIsUploading] = useState(false);
  const [activePreview, setActivePreview] = useState<DraftMaterial | null>(null);

  const add = async (file: File) => {
    if (maxFiles != null && items.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} file(s) allowed for this section.`);
      return;
    }
    const kb = Math.round(file.size / 1024);
    if (kb > MAX_KB) {
      toast.error(`File size (${(kb / 1024).toFixed(1)}MB) exceeds 25MB limit.`);
      return;
    }

    // Smart fallback title if blank: use filename without extension
    const materialTitle = title.trim() || file.name.replace(/\.[^/.]+$/, "");

    try {
      setIsUploading(true);
      const uploaded = await uploadFileToR2(file, { folder: "proposals/materials" });
      onChange([
        ...items,
        {
          kind,
          title: materialTitle,
          fileKey: uploaded.fileKey,
          fileName: uploaded.filename,
          fileUrl: uploaded.fileUrl,
          fileType: uploaded.mimeType,
          sizeKB: uploaded.sizeKB,
        },
      ]);
      setTitle("");
      toast.success("File added successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Action Box */}
      {(maxFiles == null || items.length < maxFiles) && (
        <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-3 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[160px]">
              <Input
                placeholder="Title / Name (e.g. Chapter 1 Storyboard, Character Sheet - Renji)..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs rounded-lg border-border/80 bg-background"
              />
            </div>
            {kindOptions.length > 1 && (
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as SupportingMaterialKind)}
                className="h-9 rounded-lg border border-border/80 bg-background px-3 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                {kindOptions.map((k) => (
                  <option key={k} value={k}>
                    {MATERIAL_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="h-9 rounded-lg px-4 font-bold shadow-2xs"
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {isUploading ? "Uploading..." : "Upload file"}
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) add(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {required && items.length === 0 && (
        <p className="text-[10px] font-medium text-rose-500">At least one file is required for this section.</p>
      )}

      {/* Material File List */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((m, i) => (
            <div
              key={i}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-2xs backdrop-blur-xs transition-all hover:border-primary/40"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="grid size-9 place-items-center rounded-lg bg-muted/60 border border-border/60 shrink-0">
                  {getFileIcon(m.fileType, m.fileName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider">
                      {MATERIAL_KIND_LABEL[m.kind]}
                    </span>
                    <p className="truncate text-xs font-bold text-foreground">{m.title}</p>
                  </div>
                  <p className="truncate text-[10px] text-muted-foreground pt-0.5">
                    {m.fileName} · {(m.sizeKB / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActivePreview(m)}
                  className="h-8 rounded-lg text-xs gap-1 border-border/80 hover:bg-muted font-semibold"
                >
                  <Eye className="size-3.5 text-primary" />
                  View
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  className="size-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 shrink-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePreview ? (
        <FilePreviewModal
          open={!!activePreview}
          onOpenChange={(v) => !v && setActivePreview(null)}
          fileKey={activePreview.fileKey}
          fileUrl={activePreview.fileUrl}
          fileName={activePreview.fileName}
          fileType={activePreview.fileType}
          title={activePreview.title || "File Preview"}
        />
      ) : null}
    </div>
  );
}

function FilePreviewModal({
  open,
  onOpenChange,
  fileKey,
  fileUrl,
  fileName,
  fileType,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fileKey?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  title?: string;
}) {
  const { url, loading } = useResolvedFileUrl(fileKey, fileUrl);
  const isImage = (fileType || "").includes("image") || (fileName || "").match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const isPdf = (fileType || "").includes("pdf") || (fileName || "").endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-6 flex flex-col gap-4 rounded-2xl">
        <DialogHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg font-bold text-foreground truncate">
              {title || fileName || "File Preview"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground truncate pt-0.5">
              {fileName} {fileType ? `· ${fileType}` : ""}
            </p>
          </div>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
            >
              <ExternalLink className="size-3.5 text-primary" />
              Open in new tab
            </a>
          ) : null}
        </DialogHeader>

        <div className="flex-1 min-h-[360px] max-h-[65vh] overflow-y-auto rounded-xl border border-border/80 bg-muted/20 flex flex-col items-center justify-center p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              Loading file preview...
            </div>
          ) : url ? (
            isImage ? (
              <img
                src={url}
                alt={fileName || "Preview"}
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md"
              />
            ) : isPdf ? (
              <iframe
                src={url}
                title={fileName || "PDF Preview"}
                className="w-full h-[60vh] rounded-lg border-0 bg-white shadow-xs"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <FileArchive className="size-12 text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground pt-1">
                    Preview not available directly for this file format (.zip or document).
                  </p>
                </div>
                <a
                  href={url}
                  download={fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                >
                  Download File
                </a>
              </div>
            )
          ) : (
            <div className="text-xs text-muted-foreground">File preview unavailable</div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border/60">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs font-bold">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
