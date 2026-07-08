import { useState } from "react";
import { FileText, Trash2, ExternalLink, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Chapter } from "@/entities/series/model/series-types";
import type { SupportingMaterialKind } from "@/entities/proposal/model/proposal-types";
import { MATERIAL_KIND_LABEL } from "@/entities/proposal/model/proposal-types";
import { useAuth } from "@/shared/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useMaterialsQuery,
  useCreateMaterialMutation,
  useDeleteMaterialMutation,
  type MaterialItem,
} from "../../api/series-queries";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ResolvedImage } from "@/shared/ui";
import { useResolvedFileUrl } from "../hooks/use-resolved-file-url";

function mapMaterialToFrontend(m: MaterialItem) {
  const latest = m.versions?.[m.versions.length - 1];
  return {
    id: m.id,
    title: m.title,
    kind: (m.kind ?? "other") as SupportingMaterialKind,
    fileName: latest?.fileKey ?? "unknown",
    fileKey: latest?.fileKey,
    fileUrl: latest?.url ?? "",
    fileType: latest?.mimeType ?? "application/octet-stream",
    sizeKB: latest?.size ? Math.round(latest.size / 1024) : 0,
    uploadedAt: latest?.uploadedAt ?? m.createdAt,
    note: latest?.note,
  };
}

export function ChapterMaterials({ chapter }: { chapter: Chapter }) {
  const user = useAuth((s) => s.user);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SupportingMaterialKind>("reference");
  const [file, setFile] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterialItem | null>(null);

  const { data: materials = [], isLoading } = useMaterialsQuery(chapter.id);
  const createMaterial = useCreateMaterialMutation(chapter.id, chapter.seriesId);
  const deleteMaterial = useDeleteMaterialMutation(chapter.id);

  const items = materials.map(mapMaterialToFrontend);
  const selected = items.find((m) => m.id === selectedId) ?? items[0] ?? null;
  const { url: selectedUrl } = useResolvedFileUrl(selected?.fileKey, selected?.fileUrl);

  if (!user) return null;
  const canUpload =
    user.role === "admin" ||
    user.role === "editor" ||
    user.role === "mangaka" ||
    (user.role === "assistant" && chapter.assigneeId === user.id);

  const upload = async () => {
    if (!file || !title.trim()) {
      toast.error("Cần tiêu đề và file.");
      return;
    }
    try {
      const uploaded = await uploadFileToR2(file, {
        folder: `series/${chapter.seriesId}/chapters/${chapter.id}/materials`,
      });
      await createMaterial.mutateAsync({
        title: title.trim(),
        kind,
        fileKey: uploaded.fileKey,
        url: uploaded.fileUrl,
        mimeType: uploaded.mimeType,
        size: file.size,
      });
      toast.success("Đã thêm tư liệu.");
      setTitle("");
      setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể thêm tư liệu.");
    }
  };

  const remove = async (materialId: string) => {
    try {
      await deleteMaterial.mutateAsync(materialId);
      if (selectedId === materialId) setSelectedId(null);
      toast.success("Đã xoá tư liệu.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xoá.");
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      remove(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        {canUpload ? (
          <div className="space-y-2 rounded border border-dashed border-border bg-card/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Thêm tư liệu cho chapter {chapter.number}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="ch-mat-title" className="text-[10px]">
                Tiêu đề
              </Label>
              <Input
                id="ch-mat-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="vd: Ref pose chính"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ch-mat-kind" className="text-[10px]">
                Kiểu
              </Label>
              <select
                id="ch-mat-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as SupportingMaterialKind)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
              >
                {(Object.keys(MATERIAL_KIND_LABEL) as SupportingMaterialKind[]).map((k) => (
                  <option key={k} value={k}>
                    {MATERIAL_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ch-mat-file" className="text-[10px]">
                File
              </Label>
              <Input
                id="ch-mat-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <button
              onClick={upload}
              disabled={createMaterial.isPending || !file || !title.trim()}
              className="inline-flex w-full items-center justify-center gap-1 rounded bg-foreground px-2 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
            >
              {createMaterial.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}{" "}
              Upload
            </button>
          </div>
        ) : null}

        <ul className="space-y-1">
          {isLoading ? (
            <li className="rounded border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
              Đang tải...
            </li>
          ) : items.length === 0 ? (
            <li className="rounded border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
              Chưa có tư liệu.
            </li>
          ) : (
            items.map((m) => {
              const active = selected?.id === m.id;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setSelectedId(m.id)}
                    className={`flex w-full items-start gap-2 rounded border p-2 text-left text-xs ${active ? "border-foreground bg-foreground/5" : "border-border bg-card/40 hover:bg-muted"}`}
                  >
                    <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {MATERIAL_KIND_LABEL[m.kind]} · {m.fileName} · {m.sizeKB} KB
                      </p>
                    </div>
                    {user.role === "editor" || user.role === "admin" ? (
                      <Trash2
                        className="size-3.5 text-muted-foreground hover:text-rose-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(materials.find((mat) => mat.id === m.id) ?? null);
                        }}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section className="min-h-[300px] overflow-hidden rounded border border-border bg-background">
        {selected ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs">
              <span className="font-semibold">{selected.title}</span>
              <a
                href={selectedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] hover:bg-muted"
              >
                <ExternalLink className="size-3" /> Mở file
              </a>
            </div>
            <div className="aspect-[4/3] w-full bg-muted/30">
              {selected.fileType.startsWith("image/") ? (
                <ResolvedImage
                  fileKey={selected.fileKey}
                  fallbackUrl={selected.fileUrl}
                  alt={selected.title}
                  className="h-full w-full object-contain"
                />
              ) : selected.fileType === "application/pdf" ? (
                <iframe src={selectedUrl} title={selected.title} className="h-full w-full" />
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">
                  Preview không khả dụng — dùng nút "Mở file" để xem trong tab mới.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center p-12 text-xs text-muted-foreground">
            Chọn tư liệu để xem.
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá tư liệu"
        description="Bạn có chắc muốn xoá tư liệu này? Hành động này không thể hoàn tác."
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
