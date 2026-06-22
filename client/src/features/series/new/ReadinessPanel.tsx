import { useState, useRef } from "react";
import { Check, Circle, Edit2, Loader2, Image as ImageIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";
import type { ReadinessItem } from "./useProposalForm";
import type { ProposalFormValues } from "./schema";
import type { ManuscriptFile } from "@/shared/api/manuscripts";
import { useUploadManuscript, useDeleteManuscript } from "@/shared/queries/useManuscripts";
import { useFileObjectUrl } from "@/shared/queries/useFileObjectUrl";

interface Props {
  status: string;
  readiness: ReadinessItem[];
  canSaveDraft: boolean;
  canSubmit: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  values?: ProposalFormValues;
  manuscripts?: ManuscriptFile[];
  onEdit?: () => void;
  seriesId?: string | null;
  ensureDraft?: () => Promise<string | null>;
  onAdd?: (m: ManuscriptFile) => void;
  onRemove?: (id: string) => void;
}

export function ReadinessPanel({
  status,
  readiness,
  canSaveDraft,
  canSubmit,
  isSaving,
  isSubmitting,
  onSaveDraft,
  onSubmit,
  values,
  manuscripts = [],
  onEdit,
  seriesId,
  ensureDraft,
  onAdd,
  onRemove,
}: Props) {
  const upload = useUploadManuscript();
  const remove = useDeleteManuscript();
  const [inflight, setInflight] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive statuses for the Submission Checklist
  const seriesProfileDone = readiness.filter((r) => r.key !== "manuscript").every((r) => r.done);
  const pdfFiles = manuscripts.filter((m) => m.category === "PROPOSAL_PDF" || !m.category);
  const samplePages = manuscripts.filter((m) => m.category === "SAMPLE_PAGE");
  const proposalMaterialsDone = pdfFiles.length > 0 || samplePages.length > 0;

  const coverDrafts = manuscripts.filter((m) => m.category === "COVER_DRAFT");
  const characterConcepts = manuscripts.filter((m) => m.category === "CHARACTER_CONCEPT");
  const referenceImages = manuscripts.filter((m) => m.category === "REFERENCE_IMAGE");
  const worldSettings = manuscripts.filter((m) => m.category === "WORLD_SETTING");

  const v = values || ({} as any);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ensureDraft || !onAdd) return;

    if (!(v.title || "").trim()) {
      toast.error("Add a title before uploading files.");
      return;
    }

    setInflight(true);
    try {
      const id = seriesId ?? (await ensureDraft());
      if (!id) {
        toast.error("Could not create draft. Please save and retry.");
        return;
      }
      const uploaded = await upload.mutateAsync({ seriesId: id, file, category: "COVER_DRAFT" });
      onAdd({
        ...uploaded,
        category: "COVER_DRAFT",
        url: uploaded.url || URL.createObjectURL(file),
      });
    } catch {
      // toast handled
    } finally {
      setInflight(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemoveCover = async () => {
    if (!coverDrafts[0] || !seriesId || !onRemove) return;
    try {
      await remove.mutateAsync({ seriesId, fileId: coverDrafts[0].id });
    } catch {}
    onRemove(coverDrafts[0].id);
  };

  return (
    <div className="space-y-4">
      {/* Series Summary */}
      <section className="rounded-xl border border-foreground/10 bg-white dark:bg-card shadow-sm">
        <div className="border-b border-foreground/10 px-4 py-3">
          <h3 className="text-[13px] font-semibold text-foreground/90">Series Summary</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-4">
            <div className="relative group h-32 w-24 shrink-0">
              {coverDrafts.length > 0 ? (
                <>
                  <img
                    src={coverDrafts[0].url || "https://placehold.co/150x200/png?text=Cover"}
                    alt="Cover preview"
                    className="h-full w-full object-cover rounded-md shadow-inner"
                  />
                  <button
                    onClick={handleRemoveCover}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-background/80 text-foreground/70 opacity-0 shadow-sm backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={inflight}
                  onClick={() => inputRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed border-foreground/20 bg-foreground/5 text-foreground/40 shadow-inner hover:bg-foreground/10 hover:text-foreground/70 transition-colors cursor-pointer group/upload"
                >
                  {inflight ? (
                    <Loader2 className="h-6 w-6 mb-1 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 mb-1 group-hover/upload:-translate-y-0.5 transition-transform" />
                  )}
                  <span className="text-[9px] font-medium">
                    {inflight ? "Uploading..." : "Upload Cover"}
                  </span>
                </button>
              )}
              <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="mb-2">
                <div className="text-[10px] uppercase tracking-wider text-foreground/50">Title</div>
                <div className="text-[13px] font-bold text-foreground/90 truncate">
                  {v.title || "Untitled"}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-[10px] uppercase tracking-wider text-foreground/50">Genre</div>
                <div className="text-[12px] text-foreground/80 truncate">
                  {v.genres?.join(", ") || "None"}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-[10px] uppercase tracking-wider text-foreground/50">
                  Audience
                </div>
                <div className="text-[12px] text-foreground/80">{v.targetAudience || "None"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-foreground/50">
                  Publication Type (Proposed)
                </div>
                <div className="text-[12px] text-foreground/80">
                  {v.preferredCadence === "WEEKLY"
                    ? "Weekly"
                    : v.preferredCadence === "MONTHLY"
                      ? "Monthly"
                      : "No preference"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-foreground/5 pt-3">
            <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">
              Logline
            </div>
            <p className="text-[11px] leading-relaxed text-foreground/70 line-clamp-3">
              {v.logline || "No logline provided."}
            </p>
          </div>
        </div>
      </section>

      {/* Submission Checklist */}
      <section className="rounded-xl border border-foreground/10 bg-white dark:bg-card shadow-sm">
        <div className="border-b border-foreground/10 px-4 py-3">
          <h3 className="text-[13px] font-semibold text-foreground/90">Submission Checklist</h3>
        </div>
        <div className="p-4">
          <ul className="space-y-4">
            <ChecklistItem label="Series Profile" isDone={seriesProfileDone} isOptional={false} />
            <ChecklistItem
              label="Proposal Materials"
              hint="PDF or Sample Pages uploaded"
              isDone={proposalMaterialsDone}
              isOptional={false}
            />
            <ChecklistItem
              label="Character Concepts"
              isDone={characterConcepts.length > 0}
              isOptional={true}
            />
            <ChecklistItem
              label="Cover Draft"
              hint={coverDrafts.length > 0 ? "1 file attached from Series Profile" : undefined}
              isDone={coverDrafts.length > 0}
              isOptional={true}
            />
            <ChecklistItem
              label="Reference Images"
              isDone={referenceImages.length > 0}
              isOptional={true}
            />
            <ChecklistItem
              label="World / Setting"
              isDone={worldSettings.length > 0}
              isOptional={true}
            />
          </ul>
        </div>
      </section>
    </div>
  );
}

function ChecklistItem({
  label,
  hint,
  isDone,
  isOptional,
}: {
  label: string;
  hint?: string;
  isDone: boolean;
  isOptional: boolean;
}) {
  return (
    <li className="flex items-start gap-3 text-[13px]">
      <span
        className={[
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
          isDone ? "bg-emerald-500 text-white" : "border border-foreground/20 text-foreground/20",
        ].join(" ")}
      >
        {isDone ? <Check className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}
      </span>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className={isDone ? "font-medium text-foreground/90" : "text-foreground/70"}>
            {label}
          </span>
          <span
            className={[
              "text-[10px] font-medium",
              isDone && !isOptional
                ? "text-emerald-500"
                : isDone && isOptional
                  ? "text-emerald-500"
                  : "text-foreground/40",
            ].join(" ")}
          >
            {isDone && !isOptional
              ? "Completed"
              : isDone && isOptional
                ? "Attached"
                : isOptional
                  ? "Optional"
                  : "Pending"}
          </span>
        </div>
        {hint && <span className="mt-0.5 text-[10px] text-foreground/50">{hint}</span>}
      </div>
    </li>
  );
}
