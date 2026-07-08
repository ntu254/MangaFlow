import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/auth";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import {
  useCreateSeriesMaterialMutation,
  useAddSeriesMaterialVersionMutation,
} from "../../api/series-queries";
import {
  SERIES_MATERIAL_KIND_LABEL,
  type Chapter,
  type SeriesMaterial,
  type SeriesMaterialKind,
} from "@/entities/series/model/series-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: string;
  chapters: Chapter[];
  /** when set, dialog uploads a new version for this material instead of creating */
  replaceTarget?: SeriesMaterial | null;
};

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function MaterialUploadDialog({
  open,
  onOpenChange,
  seriesId,
  chapters,
  replaceTarget,
}: Props) {
  const user = useAuth((s) => s.user);
  const createMaterial = useCreateSeriesMaterialMutation(seriesId);
  const addVersion = useAddSeriesMaterialVersionMutation(seriesId);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SeriesMaterialKind>("reference");
  const [chapterId, setChapterId] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset on open/close; build a temporary preview for the selected file only.
  useEffect(() => {
    if (!open) {
      setFile(null);
      setLocalPreview(null);
      return;
    }
    if (replaceTarget) {
      setTitle(replaceTarget.title);
      setKind(replaceTarget.kind);
      setChapterId(replaceTarget.chapterId ?? "");
      setTags(replaceTarget.tags);
      setNote("");
      setFile(null);
    } else {
      setTitle("");
      setKind("reference");
      setChapterId("");
      setTags([]);
      setNote("");
      setFile(null);
      setTagInput("");
    }
  }, [open, replaceTarget]);

  // Temporary local preview only - never persisted as canonical data.
  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const nextPreview = URL.createObjectURL(file);
      setLocalPreview(nextPreview);
      return () => URL.revokeObjectURL(nextPreview);
    }
    setLocalPreview(null);
    return undefined;
  }, [file]);

  // Revoke preview on unmount.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const uploading = busy || createMaterial.isPending || addVersion.isPending;

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const submit = async () => {
    if (!file) {
      toast.error("Chọn file.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File vượt quá giới hạn 100MB.");
      return;
    }
    if (!replaceTarget && !title.trim()) {
      toast.error("Cần tiêu đề.");
      return;
    }

    setBusy(true);
    try {
      const uploaded = await uploadFileToR2(file, {
        target: replaceTarget ? "material.version" : "material.create",
        entityId: replaceTarget?.id ?? seriesId,
      });

      if (replaceTarget) {
        await addVersion.mutateAsync({
          materialId: replaceTarget.id,
          fileKey: uploaded.fileKey,
          url: uploaded.url,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
          note: note.trim() || undefined,
          metadata: {
            fileName: uploaded.filename,
            fileType: uploaded.mimeType,
            note: note.trim() || undefined,
          },
        });
        toast.success(`Đã tải phiên bản v${replaceTarget.currentVersion + 1}.`);
      } else {
        await createMaterial.mutateAsync({
          title: title.trim(),
          kind,
          chapterId: chapterId || undefined,
          tags,
          fileKey: uploaded.fileKey,
          url: uploaded.url,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
          metadata: {
            status: "DRAFT",
            fileName: uploaded.filename,
            fileType: uploaded.mimeType,
            note: undefined,
          },
        });
        toast.success("Đã thêm tư liệu.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải lên được.");
    } finally {
      setBusy(false);
    }
  };

  const previewEl = localPreview ? (
    <img
      src={localPreview}
      alt="preview"
      className="max-h-32 rounded border border-border object-contain"
    />
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {replaceTarget ? `Tải phiên bản mới — ${replaceTarget.title}` : "Tải tư liệu lên"}
          </DialogTitle>
          <DialogDescription>
            {replaceTarget
              ? `Phiên bản hiện tại: v${replaceTarget.currentVersion}. File mới sẽ trở thành v${replaceTarget.currentVersion + 1}.`
              : "Tài nguyên dùng xuyên suốt sản xuất series."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!replaceTarget ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="mat-title" className="text-[10px] uppercase tracking-widest">
                  Tiêu đề
                </Label>
                <Input
                  id="mat-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="vd: Thorfinn Character Sheet"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mat-kind" className="text-[10px] uppercase tracking-widest">
                    Loại
                  </Label>
                  <select
                    id="mat-kind"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as SeriesMaterialKind)}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                  >
                    {(Object.keys(SERIES_MATERIAL_KIND_LABEL) as SeriesMaterialKind[]).map((k) => (
                      <option key={k} value={k}>
                        {SERIES_MATERIAL_KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mat-chapter" className="text-[10px] uppercase tracking-widest">
                    Linked chapter
                  </Label>
                  <select
                    id="mat-chapter"
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="">— Không gắn —</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        Ch. {c.number} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest">Tags</Label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background p-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        aria-label={`Xoá tag ${t}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Nhập tag rồi Enter"
                    className="min-w-[120px] flex-1 bg-transparent px-1 text-xs outline-none"
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="mat-file" className="text-[10px] uppercase tracking-widest">
              File
            </Label>
            <Input
              id="mat-file"
              type="file"
              disabled={uploading}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground">
                  {file.name} · {Math.round(file.size / 1024)} KB
                </p>
                {previewEl}
              </div>
            ) : null}
            {uploading ? (
              <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Đang tải lên R2…
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mat-note" className="text-[10px] uppercase tracking-widest">
              Ghi chú phiên bản
            </Label>
            <Textarea
              id="mat-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Tuỳ chọn"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={uploading}
            className="rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40"
          >
            Huỷ
          </button>
          <button
            onClick={submit}
            disabled={uploading || !file || (!replaceTarget && !title.trim())}
            className="inline-flex items-center gap-1.5 rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}{" "}
            {replaceTarget ? "Tải phiên bản mới" : "Tải lên"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
