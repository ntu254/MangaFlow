import { useState, useCallback } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { toast } from "sonner";

import { ChipInput } from "@/components/forms/ChipInput";
import { FileDropzone } from "@/components/upload/FileDropzone";
import type { ManuscriptFile } from "@/shared/api/manuscripts";
import { useUploadManuscript, useDeleteManuscript } from "@/shared/queries/useManuscripts";
import {
  TARGET_AUDIENCES,
  type ProposalFormValues,
  type TargetAudience,
} from "../schema";

const GENRE_SUGGESTIONS = [
  "Action", "Adventure", "Romance", "Mystery", "Slice of Life",
  "Fantasy", "Sci-Fi", "Horror", "Sports", "Comedy", "Drama", "Thriller",
];

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

export function BasicInfoStep({
  seriesId,
  ensureDraft,
  manuscripts,
  onAdd,
  onRemove,
}: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<ProposalFormValues>();
  const v = watch();

  const upload = useUploadManuscript();
  const remove = useDeleteManuscript();
  const [inflight, setInflight] = useState<InFlight[]>([]);

  const titlePresent = (v.title || "").trim().length > 0;

  const handleAdd = useCallback(
    async (files: File[]) => {
      if (!titlePresent) {
        toast.error("Add a title before uploading files.");
        return;
      }
      const id = seriesId ?? (await ensureDraft());
      if (!id) {
        toast.error("Could not create draft. Please save and retry.");
        return;
      }
      for (const file of files) {
        const localId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setInflight((p) => [
          ...p,
          { id: localId, name: file.name, size: file.size, type: file.type, category: "COVER_DRAFT", progress: 0 },
        ]);
        try {
          const uploaded = await upload.mutateAsync({
            seriesId: id,
            file,
            onProgress: (pct) =>
              setInflight((p) => p.map((f) => (f.id === localId ? { ...f, progress: pct } : f))),
          });
          onAdd({ ...uploaded, category: "COVER_DRAFT", url: uploaded.url || URL.createObjectURL(file) });
        } catch {
          // toast handled
        } finally {
          setInflight((p) => p.filter((f) => f.id !== localId));
        }
      }
    },
    [titlePresent, seriesId, ensureDraft, upload, onAdd]
  );

  const handleRemove = useCallback(
    async (id: string) => {
      if (!seriesId) {
        onRemove(id);
        return;
      }
      try {
        await remove.mutateAsync({ seriesId, fileId: id });
      } catch { }
      onRemove(id);
    },
    [seriesId, remove, onRemove]
  );

  const doneFiles = manuscripts.filter((m) => m.category === "COVER_DRAFT").map((m) => ({ id: m.id, name: m.name, size: m.size, type: m.type, url: m.url }));
  const activeFiles = inflight.filter((f) => f.category === "COVER_DRAFT").map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type, progress: f.progress }));
  const coverDrafts = [...doneFiles, ...activeFiles];

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-2xl border border-foreground/10 bg-white dark:bg-card p-6 shadow-sm">
        <header>
          <h2 className="text-base font-semibold">Basic information</h2>
          <p className="mt-0.5 text-[12px] text-foreground/55">
            Tell us about your series at a glance.
          </p>
        </header>

        <Field
          label="Title"
          required
          error={errors.title?.message}
          counter={`${(v.title ?? "").length}/120`}
        >
          <input
            {...register("title")}
            maxLength={120}
            placeholder="My new story"
            className={inputCls(!!errors.title)}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Column 1: Logline */}
          <div className="flex flex-col">
            <Field
              label="Logline"
              required
              hint="One sentence pitch"
              error={errors.logline?.message}
              counter={`${(v.logline ?? "").length}/140`}
            >
              <textarea
                {...register("logline")}
                maxLength={140}
                placeholder="A swordsman who can't draw his sword…"
                className={textareaCls(!!errors.logline) + " h-[108px] resize-none"}
              />
            </Field>
          </div>

          {/* Column 2: Audience & Cadence */}
          <div className="flex flex-col space-y-4">

            <Field
              label="Preferred publication cadence"
              hint="The Editorial Board decides the final cadence."
            >
              <Controller
                control={control}
                name="preferredCadence"
                render={({ field }) => (
                  <div className="flex rounded-lg border border-foreground/15 bg-foreground/[0.02] p-0.5">
                    {[
                      { v: "WEEKLY", label: "Weekly" },
                      { v: "MONTHLY", label: "Monthly" },
                      { v: "NONE", label: "No preference" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => field.onChange(o.v)}
                        className={[
                          "h-8 flex-1 rounded-md px-2 text-[12px] font-medium transition-colors",
                          field.value === o.v
                            ? "bg-foreground text-background shadow-sm"
                            : "text-foreground/60 hover:text-foreground",
                        ].join(" ")}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </Field>

            <Field
              label="Target audience"
              required
              error={errors.targetAudience?.message}
            >
              <select
                {...register("targetAudience")}
                className={inputCls(!!errors.targetAudience)}
              >
                {TARGET_AUDIENCES.map((a: TargetAudience) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>


          </div>
        </div>

        <Field
          label="Genres"
          required
          hint="At least 1, up to 10."
          error={errors.genres?.message}
        >
          <Controller
            control={control}
            name="genres"
            render={({ field }) => (
              <ChipInput
                value={field.value ?? []}
                onChange={field.onChange}
                suggestions={GENRE_SUGGESTIONS}
                max={10}
                placeholder="Add a genre…"
              />
            )}
          />
        </Field>
      </section>
    </div>
  );
}

// ---------- shared field primitives ----------

export function Field({
  label,
  required,
  hint,
  error,
  counter,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-foreground/75">
          {label} {required && <span className="text-destructive">*</span>}
        </span>
        {counter && (
          <span className="text-[11px] text-foreground/40">{counter}</span>
        )}
      </div>
      {children}
      <div className="mt-1 flex items-center justify-between gap-2">
        {hint && !error && (
          <span className="text-[11px] text-foreground/45">{hint}</span>
        )}
        {error && (
          <span className="text-[11px] text-destructive">{error}</span>
        )}
      </div>
    </label>
  );
}

export function inputCls(hasError: boolean) {
  return [
    "block w-full rounded-md border bg-background px-3 py-2 text-[13px] outline-none transition-colors",
    hasError
      ? "border-destructive/60 focus:border-destructive"
      : "border-foreground/15 focus:border-foreground/40 focus:bg-background",
  ].join(" ");
}

export function textareaCls(hasError: boolean) {
  return [
    "block w-full resize-y rounded-md border bg-background px-3 py-2 text-[13px] outline-none transition-colors",
    hasError
      ? "border-destructive/60 focus:border-destructive"
      : "border-foreground/15 focus:border-foreground/40",
  ].join(" ");
}
