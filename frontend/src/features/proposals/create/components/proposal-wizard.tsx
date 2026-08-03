import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, Save, Send } from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  useCreateProposalMutation,
  useUpdateProposalMutation,
  useProposalActionMutation,
} from "@/features/proposals";
import { Button } from "@/components/ui/button";
import type { SeriesProposal, SupportingMaterial } from "@/entities/proposal/model/proposal-types";
import {
  hasManuscriptFileChanged,
  latestManuscriptVersion,
} from "@/entities/proposal/model/proposal-attachments";
import type { DraftManuscript, DraftMaterial } from "./manuscript-uploader";
import { WizardStepper } from "./wizard-stepper";
import { StepBasicPitch } from "./steps/step-basic-pitch";
import { StepCharactersMaterials } from "./steps/step-characters-materials";
import { StepReviewSubmit } from "./steps/step-review-submit";
import { AdvancedDetails, type AdvancedDetailsValues } from "./advanced-details";
import { CoverUpload } from "./cover-upload";

export type WizardValues = {
  title: string;
  synopsis: string;
  genres: string[];
  targetAudience: string;
  logline: string;
  hook: string;
};

const VALID_AUDIENCES = ["shounen", "seinen", "shoujo", "josei"] as const;
type Audience = (typeof VALID_AUDIENCES)[number];

const step1Schema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Maximum 120 characters"),
  synopsis: z
    .string()
    .trim()
    .min(80, "Synopsis must be at least 80 characters")
    .max(2000, "Maximum 2 000 characters"),
  genres: z.array(z.string()).min(1, "Select at least 1 genre").max(4, "Maximum 4 genres"),
  targetAudience: z.enum(VALID_AUDIENCES, {
    errorMap: () => ({ message: "Select a target audience" }),
  }),
  logline: z.string().max(200, "Maximum 200 characters").optional().or(z.literal("")),
  hook: z.string().max(280, "Maximum 280 characters").optional().or(z.literal("")),
});

const draftSchema = z.object({
  title: z.string().trim().min(1, "Title is required to save a draft"),
});

const step2Schema = z.object({
  mainCharacters: z.string().max(1000, "Maximum 1 000 characters").optional().or(z.literal("")),
});

const STEPS = [
  { id: 1, label: "Basic Pitch", hint: "Title, genre, synopsis" },
  { id: 2, label: "Characters & Materials", hint: "Characters + uploads" },
  { id: 3, label: "Review & Submit", hint: "Confirm & submit" },
];

type ProposalWizardProps = {
  mode?: "create" | "edit";
  initialProposal?: SeriesProposal;
  onSave?: (payload: Record<string, unknown>) => Promise<unknown>;
  onCancel?: () => void;
  submitLabel?: string;
};

function latestManuscript(proposal?: SeriesProposal): DraftManuscript | null {
  const current = latestManuscriptVersion(proposal?.manuscripts ?? []);
  if (!current) return null;
  return {
    fileKey: current.fileKey,
    fileName: current.fileName,
    fileUrl: current.fileUrl,
    fileType: current.fileType,
    sizeKB: current.sizeKB,
    pageCount: current.pageCount,
    note: current.note,
  };
}

function draftMaterial(material: SupportingMaterial): DraftMaterial {
  return {
    id: material.id,
    uploadedAt: material.uploadedAt,
    kind: material.kind,
    title: material.title,
    fileKey: material.fileKey,
    fileName: material.fileName,
    fileUrl: material.fileUrl,
    fileType: material.fileType,
    sizeKB: material.sizeKB,
    note: material.note,
  };
}

export function ProposalWizard({
  mode = "create",
  initialProposal,
  onSave,
  onCancel,
  submitLabel,
}: ProposalWizardProps) {
  const isEdit = mode === "edit";
  const user = useAuth((s) => s.user);
  const createProposalMutation = useCreateProposalMutation();
  const updateProposalMutation = useUpdateProposalMutation();
  const proposalActionMutation = useProposalActionMutation();
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement | null>(null);

  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(initialProposal?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busy = isSaving || isSubmitting;

  const [values, setValues] = useState<WizardValues>({
    title: initialProposal?.title ?? "",
    synopsis: initialProposal?.synopsis ?? "",
    genres: initialProposal?.genres ?? [],
    targetAudience: initialProposal?.targetAudience ?? "",
    logline: initialProposal?.logline ?? "",
    hook: initialProposal?.hook ?? "",
  });
  const [coverUrl, setCoverUrl] = useState<string>(initialProposal?.coverUrl ?? "");
  const [coverFileKey, setCoverFileKey] = useState<string | undefined>(
    initialProposal?.coverFileKey,
  );
  const [mainCharacters, setMainCharacters] = useState(initialProposal?.mainCharacters ?? "");
  const initialManuscript = useMemo(() => latestManuscript(initialProposal), [initialProposal]);
  const [manuscript, setManuscript] = useState<DraftManuscript | null>(initialManuscript);
  const [storyboard, setStoryboard] = useState<DraftMaterial[]>(
    () =>
      initialProposal?.materials
        ?.filter((material) => material.kind === "storyboard")
        .map(draftMaterial) ?? [],
  );
  const [characterSheets, setCharacterSheets] = useState<DraftMaterial[]>(
    () =>
      initialProposal?.materials
        ?.filter((material) => material.kind !== "storyboard")
        .map(draftMaterial) ?? [],
  );
  const [advanced, setAdvanced] = useState<AdvancedDetailsValues>(initialProposal?.advanced ?? {});
  const [submissionNote, setSubmissionNote] = useState(initialProposal?.submissionNote ?? "");
  const [originalWorkConfirmed, setOriginalWorkConfirmed] = useState(
    initialProposal?.originalWorkConfirmed ?? false,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof WizardValues, string>>>({});
  const [step2Error, setStep2Error] = useState<string | undefined>(undefined);

  const step1Valid = useMemo(() => step1Schema.safeParse(values).success, [values]);
  const step2Valid = useMemo(
    () =>
      step2Schema.safeParse({ mainCharacters }).success &&
      (isEdit || (!!manuscript && storyboard.length > 0)),
    [isEdit, mainCharacters, manuscript, storyboard],
  );
  const step3Valid = originalWorkConfirmed;
  const allValid = step1Valid && step2Valid && step3Valid;

  if (!user) return null;

  const scrollTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validateStep1 = (): boolean => {
    const r = step1Schema.safeParse(values);
    if (r.success) {
      setErrors({});
      return true;
    }
    const errs: typeof errors = {};
    for (const issue of r.error.issues) {
      errs[issue.path[0] as keyof WizardValues] = issue.message;
    }
    setErrors(errs);
    return false;
  };

  const validateStep2 = (): boolean => {
    const r = step2Schema.safeParse({ mainCharacters });
    if (!r.success) {
      setStep2Error(r.error.issues[0]?.message);
      return false;
    }
    if (!isEdit && !manuscript) {
      setStep2Error("Manuscript upload is required.");
      return false;
    }
    if (!isEdit && storyboard.length === 0) {
      setStep2Error("Storyboard upload is required.");
      return false;
    }
    setStep2Error(undefined);
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(3, s + 1));
    scrollTop();
  };
  const goBack = () => {
    setStep((s) => Math.max(1, s - 1));
    scrollTop();
  };

  const resolvedAudience = (VALID_AUDIENCES as readonly string[]).includes(values.targetAudience)
    ? (values.targetAudience as Audience)
    : "seinen";

  const buildPayload = () => {
    const now = new Date().toISOString();
    const tempId = `tmp-${Date.now().toString(36)}`;
    const allMaterials: SupportingMaterial[] = [...storyboard, ...characterSheets].map((m, i) => ({
      id: `${tempId}-mat-${i}`,
      uploadedAt: now,
      ...m,
    }));
    const manuscriptChanged = hasManuscriptFileChanged(manuscript, initialManuscript);
    const previousManuscript = latestManuscriptVersion(initialProposal?.manuscripts ?? []);
    const manuscripts = isEdit
      ? [
          ...(initialProposal?.manuscripts ?? []),
          ...(manuscriptChanged
            ? [
                {
                  id: `${tempId}-mv`,
                  version:
                    Math.max(
                      0,
                      ...(initialProposal?.manuscripts ?? []).map((item) => item.version),
                    ) + 1,
                  uploadedById: user.id,
                  uploadedByName: user.name,
                  uploadedAt: now,
                  supersedes: previousManuscript?.id,
                  ...manuscript,
                },
              ]
            : []),
        ]
      : manuscript
        ? [
            {
              id: `${tempId}-mv1`,
              version: 1,
              uploadedById: user.id,
              uploadedByName: user.name,
              uploadedAt: now,
              ...manuscript,
            },
          ]
        : [];
    return {
      title: values.title.trim() || "Untitled draft",
      synopsis: values.synopsis.trim(),
      genres: values.genres,
      targetAudience: resolvedAudience,
      chaptersPlanned: 24,
      coverUrl,
      coverFileKey,
      sampleChapterUrl: manuscript?.fileUrl ?? initialProposal?.sampleChapterUrl,
      // authorName intentionally omitted: backend defaults it to the actor's name on create,
      // and patchProposalSchema rejects it (it is immutable after creation).
      logline: values.logline || undefined,
      hook: values.hook || undefined,
      mainCharacters: mainCharacters || undefined,
      originalWorkConfirmed,
      submissionNote: submissionNote || undefined,
      advanced: Object.values(advanced).some((v) => v && v.trim()) ? advanced : undefined,
      manuscripts,
      materials: allMaterials,
    };
  };

  const handleSaveDraft = async () => {
    const dr = draftSchema.safeParse(values);
    if (!dr.success) {
      toast.error(dr.error.issues[0]?.message ?? "Title is required to save a draft.");
      if (step !== 1) {
        setStep(1);
        scrollTop();
      }
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        if (!onSave) throw new Error("Edit save handler is not configured.");
        await onSave(payload);
        toast.success("Proposal changes saved.");
        return;
      }
      if (draftId) {
        await updateProposalMutation.mutateAsync({ id: draftId, ...payload });
      } else {
        const created = await createProposalMutation.mutateAsync(payload);
        setDraftId(created.id);
      }
      toast.success("Draft saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save draft failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!step1Valid) {
      setStep(1);
      validateStep1();
      toast.error("Please complete Basic Pitch (Step 1).");
      return;
    }
    if (!step2Valid) {
      setStep(2);
      validateStep2();
      toast.error("Please complete Characters & Materials (Step 2).");
      return;
    }
    if (!step3Valid) {
      toast.error("Please confirm original work ownership.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        if (!onSave) throw new Error("Edit save handler is not configured.");
        await onSave(payload);
        toast.success("Proposal changes saved.");
        return;
      }
      let activeId = draftId;
      if (activeId) {
        await updateProposalMutation.mutateAsync({ id: activeId, ...payload });
      } else {
        const created = await createProposalMutation.mutateAsync(payload);
        activeId = created.id;
        setDraftId(activeId);
      }
      await proposalActionMutation.mutateAsync({
        id: activeId,
        action: "SUBMIT",
        payload: { comment: submissionNote || undefined },
      });
      toast.success("Proposal submitted for editor review.");
      navigate({ to: "/app/submissions" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={topRef} className="mx-auto max-w-3xl space-y-6">
      <WizardStepper steps={STEPS} current={step} />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
            {step}
          </div>
          <h2 className="text-sm font-semibold">{STEPS[step - 1].label}</h2>
          <p className="text-xs text-muted-foreground">&mdash; {STEPS[step - 1].hint}</p>
        </div>

        {step === 1 ? (
          <>
            <StepBasicPitch
              values={values}
              onChange={(p) => setValues((v) => ({ ...v, ...p }))}
              errors={errors}
            />
            <div className="mt-6">
              <AdvancedDetails values={advanced} onChange={setAdvanced} />
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <StepCharactersMaterials
            mainCharacters={mainCharacters}
            onMainCharactersChange={setMainCharacters}
            manuscript={manuscript}
            onManuscriptChange={setManuscript}
            storyboard={storyboard}
            onStoryboardChange={setStoryboard}
            characterSheets={characterSheets}
            onCharacterSheetsChange={setCharacterSheets}
            filesRequired={!isEdit}
            error={step2Error}
          />
        ) : null}
        {step === 3 ? (
          <StepReviewSubmit
            values={values}
            mainCharacters={mainCharacters}
            manuscript={manuscript}
            storyboard={storyboard}
            characterSheets={characterSheets}
            submissionNote={submissionNote}
            onSubmissionNoteChange={setSubmissionNote}
            originalWorkConfirmed={originalWorkConfirmed}
            onOriginalWorkConfirmedChange={setOriginalWorkConfirmed}
            coverUrl={coverUrl}
          />
        ) : null}
      </div>

      {step === 1 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Cover Image
          </p>
          <CoverUpload
            value={coverUrl}
            fileKey={coverFileKey}
            onChange={({ url, fileKey }) => {
              setCoverUrl(url);
              setCoverFileKey(fileKey);
            }}
          />
        </div>
      ) : null}

      <Checklist step1Valid={step1Valid} step2Valid={step2Valid} step3Valid={step3Valid} />

      <div className="sticky bottom-0 z-10 rounded-lg border border-border bg-card/95 px-5 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          {step === 1 && isEdit && onCancel ? (
            <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
              <ArrowLeft className="size-3.5" />
              Cancel edit
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={goBack} disabled={step === 1 || busy}>
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button size="sm" onClick={goNext} disabled={busy}>
              Continue
              <ArrowRight className="size-3.5" />
            </Button>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {!isEdit ? (
              <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={busy}>
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {isSaving ? "Saving…" : "Save draft"}
              </Button>
            ) : null}

            {step === 3 ? (
              <Button size="sm" onClick={handleSubmit} disabled={!allValid || busy}>
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                {isSubmitting
                  ? "Saving…"
                  : isEdit
                    ? (submitLabel ?? "Save changes")
                    : "Submit to editor"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Checklist({
  step1Valid,
  step2Valid,
  step3Valid,
}: {
  step1Valid: boolean;
  step2Valid: boolean;
  step3Valid: boolean;
}) {
  const items = [
    { label: "Basic Pitch", done: step1Valid },
    { label: "Characters & Materials", done: step2Valid },
    { label: "Original work confirmed", done: step3Valid },
  ];

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Submission checklist
      </p>
      <ul className="space-y-0.5 text-[11px]">
        {items.map((it) => (
          <li
            key={it.label}
            className={`flex items-center gap-1.5 ${it.done ? "text-emerald-700" : "text-muted-foreground"}`}
          >
            {it.done ? (
              <Check className="size-3" />
            ) : (
              <span className="inline-block size-3 text-center">&bull;</span>
            )}
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
