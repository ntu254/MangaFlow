import { useCallback, useRef, useState, type DragEvent } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Upload,
  X,
  Users,
  Frame,
  Map,
  Image,
} from "lucide-react";
import { useUploadManuscript, useDeleteManuscript } from "@/shared/queries/useManuscripts";
import type { ManuscriptFile } from "@/shared/api/manuscripts";
import type { ProposalFormValues } from "../schema";
import { FileDropzone, type DropzoneFileItem } from "@/components/upload/FileDropzone";

interface Props {
  seriesId: string | null;
  ensureDraft: () => Promise<string | null>;
  manuscripts: ManuscriptFile[];
  onAdd: (m: ManuscriptFile) => void;
  onRemove: (id: string) => void;
}

interface InFlight {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  progress: number;
}

export function ManuscriptStep({ seriesId, ensureDraft, manuscripts, onAdd, onRemove }: Props) {
  const { watch } = useFormContext<ProposalFormValues>();
  const title = watch("title");
  const titlePresent = title.trim().length > 0;

  const upload = useUploadManuscript();
  const remove = useDeleteManuscript();
  const [inflight, setInflight] = useState<InFlight[]>([]);

  const handleAdd = useCallback(
    async (files: File[], category: string) => {
      if (!titlePresent) return;
      const id = seriesId ?? (await ensureDraft());
      if (!id) {
        toast.error("Could not create draft. Please save and retry.");
        return;
      }
      for (const file of files) {
        const localId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setInflight((p) => [
          ...p,
          { id: localId, name: file.name, size: file.size, type: file.type, category, progress: 0 },
        ]);
        try {
          const uploaded = await upload.mutateAsync({
            seriesId: id,
            file,
            category,
            onProgress: (pct) =>
              setInflight((p) => p.map((f) => (f.id === localId ? { ...f, progress: pct } : f))),
          });
          onAdd({ ...uploaded, category, url: uploaded.url || URL.createObjectURL(file) }); // assign category locally
        } catch {
          // toast handled by hook
        } finally {
          setInflight((p) => p.filter((f) => f.id !== localId));
        }
      }
    },
    [titlePresent, seriesId, ensureDraft, upload, onAdd],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      if (!seriesId) {
        onRemove(id);
        return;
      }
      try {
        await remove.mutateAsync({ seriesId, fileId: id });
      } catch {}
      onRemove(id);
    },
    [seriesId, remove, onRemove],
  );

  const getFiles = (cat: string): DropzoneFileItem[] => {
    const done = manuscripts
      .filter((m) => m.category === cat || (!m.category && cat === "PROPOSAL_PDF"))
      .map((m) => ({ id: m.id, name: m.name, size: m.size, type: m.type, url: m.url }));
    const active = inflight
      .filter((f) => f.category === cat)
      .map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type, progress: f.progress }));
    return [...done, ...active];
  };

  const pdfFiles = getFiles("PROPOSAL_PDF");
  const samplePages = getFiles("SAMPLE_PAGE");
  const hasProposalMaterials = pdfFiles.length > 0 || samplePages.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {!titlePresent && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[12px] text-amber-700 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Add a title before uploading manuscript files.</span>
        </div>
      )}

      {/* 1. Proposal Materials */}
      <section className="space-y-4 rounded-xl border border-foreground/10 bg-white dark:bg-card p-5 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground/90">
              1. Proposal Materials{" "}
              <span className="text-foreground/50 font-normal">(Required)</span>
            </h2>
            <p className="mt-0.5 text-[12px] text-foreground/60">
              Upload at least one: Proposal Manuscript (PDF) or Sample Pages.
            </p>
          </div>
          {hasProposalMaterials && (
            <div className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Completed
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* PDF Column */}
          <div className="flex flex-col rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 min-w-0">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-foreground/80">
              <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded bg-indigo-500/10 text-indigo-500">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate">Proposal Manuscript (PDF)</div>
                <div className="text-[11px] font-normal text-foreground/50 truncate">
                  Recommended for full review
                </div>
              </div>
            </div>
            <FileDropzone
              accept=".pdf"
              maxSizeMb={100}
              multiple={false}
              files={pdfFiles}
              onAdd={(files) => handleAdd(files, "PROPOSAL_PDF")}
              onRemove={handleRemove}
              disabled={!titlePresent}
              disabledReason="Add a title first to enable uploads"
              hint="PDF up to 100MB"
            />
          </div>

          {/* Sample Pages Column */}
          <div className="flex flex-col rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 text-[13px] font-medium text-foreground/80">
                <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-500">
                  <ImageIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate">Sample Pages</div>
                  <div className="text-[11px] font-normal text-foreground/50 truncate">
                    Upload 1 or more sample pages.
                  </div>
                </div>
              </div>
              {samplePages.length > 0 && (
                <div className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                  {samplePages.length} uploaded
                </div>
              )}
            </div>

            <SamplePagesUpload
              files={samplePages}
              onAdd={(files) => handleAdd(files, "SAMPLE_PAGE")}
              onRemove={handleRemove}
              disabled={!titlePresent}
            />
          </div>
        </div>
      </section>

      {/* 2. Supporting Materials */}
      <section className="space-y-4 rounded-xl border border-foreground/10 bg-white dark:bg-card p-5 shadow-sm">
        <header>
          <h2 className="text-sm font-semibold text-foreground/90">
            2. Supporting Materials{" "}
            <span className="text-foreground/50 font-normal">(Optional)</span>
          </h2>
          <p className="mt-0.5 text-[12px] text-foreground/60">
            These materials help editors and the board understand your series better.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SupportingMaterialCard
            title="Character Concepts"
            desc="Share characters, expressions, and key details."
            icon={<Users className="h-4 w-4" />}
            colorClass="text-emerald-500 bg-emerald-500/10"
            files={getFiles("CHARACTER_CONCEPT")}
            onAdd={(files) => handleAdd(files, "CHARACTER_CONCEPT")}
            onRemove={handleRemove}
            disabled={!titlePresent}
            max={10}
          />
          <SupportingMaterialCard
            title="Reference Images"
            desc="Reference photos, mood boards, or scenes."
            icon={<Image className="h-4 w-4" />}
            colorClass="text-purple-500 bg-purple-500/10"
            files={getFiles("REFERENCE_IMAGE")}
            onAdd={(files) => handleAdd(files, "REFERENCE_IMAGE")}
            onRemove={handleRemove}
            disabled={!titlePresent}
            max={10}
          />
          <SupportingMaterialCard
            title="World / Setting"
            desc="Share worldbuilding, locations, cultures, or lore."
            icon={<Map className="h-4 w-4" />}
            colorClass="text-blue-500 bg-blue-500/10"
            files={getFiles("WORLD_SETTING")}
            onAdd={(files) => handleAdd(files, "WORLD_SETTING")}
            onRemove={handleRemove}
            disabled={!titlePresent}
            max={10}
          />
        </div>
      </section>
    </div>
  );
}

// --- Local Subcomponents ---

function SamplePagesUpload({
  files,
  onAdd,
  onRemove,
  disabled,
}: {
  files: (DropzoneFileItem & { url?: string })[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAdd(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {files.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {files.map((f, i) => (
            <div
              key={f.id}
              className="group relative aspect-[3/4] overflow-hidden rounded-md border border-foreground/10 bg-foreground/5"
            >
              {f.progress !== undefined && f.progress < 100 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center text-[10px]">
                  Uploading... {f.progress}%
                </div>
              ) : (
                <>
                  <div className="absolute left-1 top-1 z-10 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur">
                    {i + 1}
                  </div>
                  <button
                    onClick={() => onRemove(f.id)}
                    className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded bg-background/80 text-foreground/70 opacity-0 shadow-sm backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {/* Image thumbnail */}
                  {f.url || f.name.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                    <img
                      src={f.url || "https://placehold.co/150x200/png?text=Sample"}
                      alt={f.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-foreground/40">
                      {f.name}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-1.5 py-1 text-[9px] text-foreground/70 backdrop-blur">
                    {f.name} ({(f.size / 1024 / 1024).toFixed(1)}MB)
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-foreground/20 text-[12px] font-medium text-foreground/70 hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" /> Add more pages
        </button>
        <div className="mt-2 text-center text-[10px] text-foreground/45">
          JPG, PNG, WEBP up to 10MB each
        </div>
      </div>
      <input
        type="file"
        ref={inputRef}
        hidden
        multiple
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
      />
    </div>
  );
}

function SupportingMaterialCard({
  title,
  desc,
  icon,
  colorClass,
  files,
  onAdd,
  onRemove,
  disabled,
  max,
  isCover,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  colorClass: string;
  files: DropzoneFileItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
  max: number;
  isCover?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAdd(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col min-w-0 rounded-xl border border-foreground/10 bg-foreground/[0.015] p-3 text-center">
      <div
        className={`mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
      >
        {icon}
      </div>
      <h3 className="mt-2 truncate text-[12px] font-semibold text-foreground/90">{title}</h3>
      <p className="mt-0.5 text-[10px] text-foreground/55 line-clamp-2">{desc}</p>

      <div className="mt-auto pt-3">
        {hasFiles ? (
          <div className="space-y-2">
            <div className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="inline h-3 w-3 mr-1" />
              {files.length} file{files.length > 1 ? "s" : ""} attached
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="flex h-7 flex-1 items-center justify-center rounded border border-foreground/15 text-[11px] font-medium text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
              >
                Replace
              </button>
              <button
                onClick={() => {
                  files.forEach((f) => onRemove(f.id));
                }}
                disabled={disabled}
                className="flex h-7 flex-1 items-center justify-center rounded border border-destructive/20 text-[11px] font-medium text-destructive hover:bg-destructive/5"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="flex h-8 w-full items-center justify-center rounded-lg border border-foreground/15 bg-background text-[11px] font-medium text-foreground/80 shadow-sm hover:border-foreground/30 hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upload
            </button>
            <div className="mt-1.5 text-[10px] text-foreground/45">0/{max} files</div>
          </>
        )}
      </div>
      <input
        type="file"
        ref={inputRef}
        hidden
        multiple={max > 1}
        accept={isCover ? ".jpg,.jpeg,.png,.webp" : undefined}
        onChange={handleFileChange}
      />
    </div>
  );
}
