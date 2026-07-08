import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  LayoutGrid,
  List,
  FolderPlus,
  Upload,
  FileText,
  Image as ImageIcon,
  Layers,
  Palette,
  Type,
  Sparkles,
  Eye,
  Download,
  MoreHorizontal,
  Trash2,
  Replace,
  X,
  CheckCircle2,
  Files,
  Wand2,
  ImagePlus,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatCard } from "@/shared/ui/stat-card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/shared/auth";
import {
  useSeriesMaterialsQuery,
  useUpdateSeriesMaterialMutation,
  useDeleteSeriesMaterialMutation,
} from "../../api/series-queries";
import { mapApiMaterialToSeriesMaterial } from "@/entities/proposal/model/map-material";
import { useResolvedFileUrl } from "../hooks/use-resolved-file-url";
import { MaterialPreviewImage, MaterialDownloadLink } from "./material-file-controls";
import { formatDate } from "@/shared/lib/format-date";
import {
  SERIES_MATERIAL_KIND_LABEL,
  SERIES_MATERIAL_STATUS_LABEL,
  type Chapter,
  type ProductionSeries,
  type SeriesMaterial,
  type SeriesMaterialKind,
  type SeriesMaterialStatus,
} from "@/entities/series/model/series-types";
import { MaterialUploadDialog } from "./material-upload-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

const KIND_CHIPS: Array<{ value: SeriesMaterialKind | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "storyboard", label: "Storyboard / Name" },
  { value: "manuscript", label: "Manuscript" },
  { value: "character", label: "Character Sheets" },
  { value: "reference", label: "References" },
  { value: "moodboard", label: "Moodboard" },
  { value: "other", label: "Khác" },
];

const STATUS_TONE: Record<SeriesMaterialStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  IN_REVIEW:
    "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200",
  APPROVED:
    "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200",
  ARCHIVED: "bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300",
};

function kindIcon(kind: SeriesMaterialKind, className = "size-4") {
  switch (kind) {
    case "storyboard":
      return <Layers className={className} />;
    case "manuscript":
      return <FileText className={className} />;
    case "character":
      return <Sparkles className={className} />;
    case "background":
      return <ImageIcon className={className} />;
    case "moodboard":
      return <Palette className={className} />;
    case "reference":
      return <ImagePlus className={className} />;
    case "sfx":
      return <Type className={className} />;
    case "style_guide":
      return <Wand2 className={className} />;
    case "brush":
      return <Wand2 className={className} />;
    default:
      return <Files className={className} />;
  }
}

function fmtSize(kb: number) {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

type SortKey = "newest" | "oldest" | "alpha" | "version";

export function SeriesMaterialsLibrary({
  series,
  chapters,
}: {
  series: ProductionSeries;
  chapters: Chapter[];
}) {
  const user = useAuth((s) => s.user);
  const { data: rawMaterials = [], isLoading } = useSeriesMaterialsQuery(series.id);
  const updateMutation = useUpdateSeriesMaterialMutation(series.id);
  const deleteMutation = useDeleteSeriesMaterialMutation(series.id);

  const updateMaterial = (
    id: string,
    patch: {
      title?: string;
      chapterId?: string | null;
      tags?: string[];
      note?: string;
      status?: SeriesMaterialStatus;
    },
  ) => {
    const metadata: Record<string, unknown> = {};
    if (patch.status !== undefined) metadata.status = patch.status;
    if (patch.note !== undefined) metadata.note = patch.note;
    updateMutation.mutate(
      {
        materialId: id,
        title: patch.title,
        tags: patch.tags,
        chapterId: patch.chapterId,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
      {
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Khong cap nhat duoc tu lieu."),
      },
    );
  };

  const removeMaterial = (id: string) => {
    deleteMutation.mutate(id, {
      onError: (e) => toast.error(e instanceof Error ? e.message : "Khong xoa duoc tu lieu."),
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      removeMaterial(deleteTarget.id);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      toast.success("Đã xoá tư liệu.");
      setDeleteTarget(null);
    }
  };

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<SeriesMaterialKind | "ALL">("ALL");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<SeriesMaterial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SeriesMaterial | null>(null);

  const materials = useMemo(() => rawMaterials.map(mapApiMaterialToSeriesMaterial), [rawMaterials]);

  const canEdit =
    !!user && (user.role === "admin" || user.role === "editor" || user.role === "mangaka");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = materials.filter((m) => {
      if (kindFilter !== "ALL" && m.kind !== kindFilter) return false;
      if (!q) return true;
      const cur = m.versions[0];
      return (
        m.title.toLowerCase().includes(q) ||
        cur?.fileName.toLowerCase().includes(q) ||
        cur?.uploadedByName.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.updatedAt.localeCompare(b.updatedAt);
        case "alpha":
          return a.title.localeCompare(b.title);
        case "version":
          return b.currentVersion - a.currentVersion;
        case "newest":
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
    return list;
  }, [materials, search, kindFilter, sort]);

  const selected = useMemo(
    () => materials.find((m) => m.id === selectedId) ?? null,
    [materials, selectedId],
  );

  const kpis = useMemo(() => {
    const total = materials.length;
    const storyboard = materials.filter((m) => m.kind === "storyboard").length;
    const manuscript = materials.filter((m) => m.kind === "manuscript").length;
    const ref = materials.filter(
      (m) => m.kind === "reference" || m.kind === "background" || m.kind === "moodboard",
    ).length;
    const weekAgo = Date.now() - 7 * 86400000;
    const recent = materials.filter((m) => new Date(m.updatedAt).getTime() >= weekAgo).length;
    return { total, storyboard, manuscript, ref, recent };
  }, [materials]);

  const chapterById = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters]);

  const openReplace = (m: SeriesMaterial) => {
    setReplaceTarget(m);
    setUploadOpen(true);
  };
  const openCreate = () => {
    setReplaceTarget(null);
    setUploadOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-2xl">Kho tư liệu</h2>
          <p className="text-xs text-muted-foreground">
            Quản lý và chia sẻ toàn bộ tư liệu sản xuất của series
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info("Tính năng tạo thư mục đang được chuẩn bị.")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-semibold hover:bg-muted"
          >
            <FolderPlus className="size-3.5" /> Tạo thư mục
          </button>
          {canEdit ? (
            <button
              onClick={openCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-bold uppercase tracking-widest text-background hover:opacity-90"
            >
              <Upload className="size-3.5" /> Tải tư liệu lên
            </button>
          ) : null}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Files className="size-4" />}
          tone="blue"
          label="Tổng tư liệu"
          value={kpis.total}
          hint={`${kpis.recent} mới 7 ngày`}
        />
        <StatCard
          icon={<Layers className="size-4" />}
          tone="emerald"
          label="Storyboard / Name"
          value={kpis.storyboard}
          hint={pct(kpis.storyboard, kpis.total)}
        />
        <StatCard
          icon={<FileText className="size-4" />}
          tone="amber"
          label="Manuscript"
          value={kpis.manuscript}
          hint={pct(kpis.manuscript, kpis.total)}
        />
        <StatCard
          icon={<ImagePlus className="size-4" />}
          tone="violet"
          label="References"
          value={kpis.ref}
          hint={pct(kpis.ref, kpis.total)}
        />
        <StatCard
          icon={<Clock className="size-4" />}
          tone="orange"
          label="Cập nhật gần đây"
          value={kpis.recent}
          hint="7 ngày qua"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tư liệu, tag, người tải..."
            className="h-9 pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {KIND_CHIPS.map((c) => {
            const active = kindFilter === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setKindFilter(c.value)}
                className={`h-8 rounded-full border px-3 text-[11px] font-semibold transition ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            Sắp xếp:
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs font-semibold"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="alpha">A → Z</option>
              <option value="version">Version cao</option>
            </select>
          </label>
          <div className="flex items-center rounded-md border border-border bg-background">
            <button
              onClick={() => setView("grid")}
              className={`grid size-8 place-items-center rounded-l-md ${view === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`grid size-8 place-items-center rounded-r-md ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              aria-label="List view"
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={`grid gap-4 ${selected ? "lg:grid-cols-[1fr_360px]" : "grid-cols-1"}`}>
        <div>
          {isLoading ? (
            <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center text-xs text-muted-foreground">
              Đang tải tư liệu…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center text-xs text-muted-foreground">
              Chưa có tư liệu phù hợp.
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  chapter={m.chapterId ? chapterById.get(m.chapterId) : undefined}
                  selected={selected?.id === m.id}
                  onSelect={() => setSelectedId(m.id === selectedId ? null : m.id)}
                  onReplace={() => openReplace(m)}
                  onDelete={() => {
                    setDeleteTarget(m);
                  }}
                  canEdit={canEdit}
                />
              ))}
            </div>
          ) : (
            <MaterialTable
              materials={filtered}
              chapterById={chapterById}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
              onReplace={openReplace}
              onDelete={(m) => {
                setDeleteTarget(m);
              }}
              canEdit={canEdit}
            />
          )}
        </div>

        {selected ? (
          <MaterialDetail
            key={selected.id}
            material={selected}
            chapters={chapters}
            canEdit={canEdit}
            onClose={() => setSelectedId(null)}
            onReplace={() => openReplace(selected)}
            onPatch={(p) => updateMaterial(selected.id, p)}
          />
        ) : null}
      </div>

      <MaterialUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        seriesId={series.id}
        chapters={chapters}
        replaceTarget={replaceTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá tư liệu"
        description={
          deleteTarget ? (
            <span>
              Bạn có chắc muốn xoá <strong>"{deleteTarget.title}"</strong>? Hành động này không thể
              hoàn tác.
            </span>
          ) : (
            ""
          )
        }
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function pct(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function MaterialCard({
  material,
  chapter,
  selected,
  onSelect,
  onReplace,
  onDelete,
  canEdit,
}: {
  material: SeriesMaterial;
  chapter?: Chapter;
  selected: boolean;
  onSelect: () => void;
  onReplace: () => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  const cur = material.versions[0];
  const isImage = !!cur?.fileType.startsWith("image/");
  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-md border bg-card transition ${
        selected
          ? "border-foreground ring-1 ring-foreground"
          : "border-border hover:border-foreground/40"
      }`}
    >
      <button
        onClick={onSelect}
        className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden bg-muted/40 text-muted-foreground"
      >
        {isImage ? (
          <MaterialPreviewImage
            fileKey={cur.fileKey}
            fallbackUrl={cur.fileUrl}
            alt={material.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            {kindIcon(material.kind, "size-8")}
            <span className="text-[10px] uppercase tracking-widest">
              {cur?.fileType.split("/")[1] ?? "file"}
            </span>
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest backdrop-blur">
          {kindIcon(material.kind, "size-3")} {SERIES_MATERIAL_KIND_LABEL[material.kind]}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest">
          v{material.currentVersion}
        </span>
      </button>
      <div className="flex min-w-0 flex-col gap-1 p-3">
        <p className="truncate text-xs font-semibold">{cur?.fileName ?? material.title}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {chapter ? `Ch. ${String(chapter.number).padStart(2, "0")}` : "—"} ·{" "}
          {formatDate(material.updatedAt)} · {cur?.uploadedByName ?? ""}
        </p>
        <div className="mt-1 flex items-center gap-1">
          <button
            onClick={onSelect}
            className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded border border-border bg-background text-[11px] font-semibold hover:bg-muted"
          >
            <Eye className="size-3" /> Xem
          </button>
          <MaterialDownloadLink
            fileKey={cur?.fileKey}
            fallbackUrl={cur?.fileUrl}
            fileName={cur?.fileName}
            className="inline-flex h-7 items-center justify-center rounded border border-border bg-background px-2 text-[11px] font-semibold hover:bg-muted"
            ariaLabel="Download"
          >
            <Download className="size-3" />
          </MaterialDownloadLink>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex h-7 items-center justify-center rounded border border-border bg-background px-2 text-[11px] font-semibold hover:bg-muted"
                aria-label="Khác"
              >
                <MoreHorizontal className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              {canEdit ? (
                <DropdownMenuItem onClick={onReplace}>
                  <Replace className="mr-2 size-3.5" /> Tải phiên bản mới
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={onSelect}>
                <Eye className="mr-2 size-3.5" /> Mở chi tiết
              </DropdownMenuItem>
              {canEdit ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-rose-600 focus:text-rose-700"
                  >
                    <Trash2 className="mr-2 size-3.5" /> Xoá
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function MaterialTable({
  materials,
  chapterById,
  selectedId,
  onSelect,
  onReplace,
  onDelete,
  canEdit,
}: {
  materials: SeriesMaterial[];
  chapterById: Map<string, Chapter>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReplace: (m: SeriesMaterial) => void;
  onDelete: (m: SeriesMaterial) => void;
  canEdit: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <table className="w-full text-xs">
        <thead className="bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Tên</th>
            <th className="px-3 py-2 text-left">Loại</th>
            <th className="px-3 py-2 text-left">v</th>
            <th className="px-3 py-2 text-left">Chapter</th>
            <th className="px-3 py-2 text-left">Người tải</th>
            <th className="px-3 py-2 text-left">Ngày</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => {
            const cur = m.versions[0];
            const chapter = m.chapterId ? chapterById.get(m.chapterId) : undefined;
            const active = selectedId === m.id;
            return (
              <tr
                key={m.id}
                className={`cursor-pointer border-t border-border ${active ? "bg-muted/60" : "hover:bg-muted/30"}`}
                onClick={() => onSelect(m.id)}
              >
                <td className="px-3 py-2 font-semibold">{cur?.fileName ?? m.title}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    {kindIcon(m.kind, "size-3")} {SERIES_MATERIAL_KIND_LABEL[m.kind]}
                  </span>
                </td>
                <td className="px-3 py-2">v{m.currentVersion}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {chapter ? `Ch. ${String(chapter.number).padStart(2, "0")}` : "—"}
                </td>
                <td className="px-3 py-2">{cur?.uploadedByName}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatDate(m.updatedAt)}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${STATUS_TONE[m.status]}`}
                  >
                    {SERIES_MATERIAL_STATUS_LABEL[m.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="inline-flex h-7 items-center justify-center rounded border border-border bg-background px-2 hover:bg-muted"
                        aria-label="Khác"
                      >
                        <MoreHorizontal className="size-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem onClick={() => onSelect(m.id)}>
                        <Eye className="mr-2 size-3.5" /> Xem
                      </DropdownMenuItem>
                      {canEdit ? (
                        <>
                          <DropdownMenuItem onClick={() => onReplace(m)}>
                            <Replace className="mr-2 size-3.5" /> Tải phiên bản mới
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(m)}
                            className="text-rose-600 focus:text-rose-700"
                          >
                            <Trash2 className="mr-2 size-3.5" /> Xoá
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MaterialDetail({
  material,
  chapters,
  canEdit,
  onClose,
  onReplace,
  onPatch,
}: {
  material: SeriesMaterial;
  chapters: Chapter[];
  canEdit: boolean;
  onClose: () => void;
  onReplace: () => void;
  onPatch: (patch: {
    title?: string;
    chapterId?: string | null;
    tags?: string[];
    note?: string;
    status?: SeriesMaterialStatus;
  }) => void;
}) {
  const cur = material.versions[0];
  const isImage = !!cur?.fileType.startsWith("image/");
  const [tagInput, setTagInput] = useState("");
  const [note, setNote] = useState(material.note ?? "");

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!material.tags.includes(t)) onPatch({ tags: [...material.tags, t] });
    setTagInput("");
  };

  return (
    <aside className="space-y-3 rounded-md border border-border bg-card p-3 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{cur?.fileName ?? material.title}</p>
          <p className="text-[10px] text-muted-foreground">{material.title}</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="aspect-[4/3] w-full overflow-hidden rounded border border-border bg-muted/40">
        {isImage ? (
          <MaterialPreviewImage
            fileKey={cur.fileKey}
            fallbackUrl={cur.fileUrl}
            alt={material.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            {kindIcon(material.kind, "size-10")}
          </div>
        )}
      </div>

      <dl className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1.5 text-[11px]">
        <dt className="text-muted-foreground">Loại file</dt>
        <dd>{cur?.fileType || "—"}</dd>
        <dt className="text-muted-foreground">Phiên bản hiện tại</dt>
        <dd>
          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
            v{material.currentVersion}
          </span>
        </dd>
        <dt className="text-muted-foreground">Trạng thái</dt>
        <dd>
          <select
            value={material.status}
            disabled={!canEdit}
            onChange={(e) => onPatch({ status: e.target.value as SeriesMaterialStatus })}
            className={`h-6 rounded border border-border bg-background px-1.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_TONE[material.status]}`}
          >
            {(Object.keys(SERIES_MATERIAL_STATUS_LABEL) as SeriesMaterialStatus[]).map((s) => (
              <option key={s} value={s}>
                {SERIES_MATERIAL_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </dd>
        <dt className="text-muted-foreground">Kích thước</dt>
        <dd>{cur ? fmtSize(cur.sizeKB) : "—"}</dd>
        <dt className="text-muted-foreground">Đã tải lên</dt>
        <dd>{cur ? formatDate(cur.uploadedAt) : "—"}</dd>
        <dt className="text-muted-foreground">Người tải lên</dt>
        <dd>{cur?.uploadedByName}</dd>
        <dt className="text-muted-foreground">Liên kết chapter</dt>
        <dd>
          <select
            value={material.chapterId ?? ""}
            disabled={!canEdit}
            onChange={(e) => onPatch({ chapterId: e.target.value || null })}
            className="h-6 rounded border border-border bg-background px-1.5 text-[11px]"
          >
            <option value="">— Không gắn —</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                Ch. {c.number} — {c.title}
              </option>
            ))}
          </select>
        </dd>
        <dt className="text-muted-foreground">Tags</dt>
        <dd>
          <div className="flex flex-wrap items-center gap-1">
            {material.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold"
              >
                {t}
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => onPatch({ tags: material.tags.filter((x) => x !== t) })}
                    aria-label={`Xoá tag ${t}`}
                  >
                    <X className="size-2.5" />
                  </button>
                ) : null}
              </span>
            ))}
            {canEdit ? (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="+ tag"
                className="h-5 min-w-[60px] flex-1 rounded border border-dashed border-border bg-transparent px-1 text-[10px] outline-none"
              />
            ) : null}
          </div>
        </dd>
      </dl>

      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Ghi chú
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== (material.note ?? "")) onPatch({ note });
          }}
          disabled={!canEdit}
          rows={2}
          className="w-full rounded border border-border bg-background p-2 text-[11px]"
          placeholder="Ghi chú cho team..."
        />
      </div>

      <div className="flex items-center gap-2">
        <MaterialDownloadLink
          fileKey={cur?.fileKey}
          fallbackUrl={cur?.fileUrl}
          fileName={cur?.fileName}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded border border-border bg-background px-3 text-xs font-semibold hover:bg-muted"
          ariaLabel="Download"
        >
          <Download className="size-3.5" /> Download
        </MaterialDownloadLink>
        {canEdit ? (
          <button
            onClick={onReplace}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded bg-foreground px-3 text-xs font-semibold text-background hover:bg-foreground/90"
          >
            <Replace className="size-3.5" /> Replace
          </button>
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Lịch sử phiên bản
        </p>
        <ul className="space-y-1.5">
          {material.versions.map((v, idx) => (
            <li
              key={v.id}
              className="flex items-start gap-2 rounded border border-border bg-background p-2 text-[11px]"
            >
              <div
                className={`mt-0.5 grid size-5 place-items-center rounded-full ${idx === 0 ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
              >
                {idx === 0 ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <span className="text-[9px] font-bold">v{v.version}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded bg-muted px-1 text-[9px] font-bold">
                    v{v.version}
                  </span>
                  <span className="text-muted-foreground">{formatDate(v.uploadedAt)}</span>
                </p>
                <p className="truncate text-muted-foreground">
                  <span className="font-semibold text-foreground">{v.uploadedByName}</span>
                  {v.note ? ` · ${v.note}` : ""}
                </p>
              </div>
              <MaterialDownloadLink
                fileKey={v.fileKey}
                fallbackUrl={v.fileUrl}
                fileName={v.fileName}
                className="text-muted-foreground hover:text-foreground"
                ariaLabel={`Download v${v.version}`}
              >
                <Download className="size-3.5" />
              </MaterialDownloadLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
