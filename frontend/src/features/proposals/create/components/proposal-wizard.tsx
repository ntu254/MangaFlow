import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  useCreateProposalMutation,
  useUpdateProposalMutation,
  useProposalActionMutation,
} from "@/features/proposals";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResolvedImage } from "@/shared/ui";
import type {
  RequestedChange,
  SeriesProposal,
  SupportingMaterial,
} from "@/entities/proposal/model/proposal-types";
import {
  ResubmitChecklistEditor,
  RevisionNotesField,
} from "../../detail/components/resubmit-checklist-editor";
import type { ResolvedItemState } from "../../detail/components/resubmit-checklist-editor";
import {
  hasManuscriptFileChanged,
  latestManuscriptVersion,
} from "@/entities/proposal/model/proposal-attachments";
import type { DraftManuscript, DraftMaterial } from "./manuscript-uploader";
import { WizardStepper } from "./wizard-stepper";
import { StepBasicPitch } from "./steps/step-basic-pitch";
import { StepCharactersMaterials } from "./steps/step-characters-materials";
import { StepReviewSubmit } from "./steps/step-review-submit";
import { CoverUpload } from "./cover-upload";

export type WizardValues = {
  title: string;
  synopsis: string;
  genres: string[];
  targetAudience: string;
  chaptersPlanned: number;
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
  chaptersPlanned: z
    .number()
    .int()
    .min(1, "At least 1 chapter is required")
    .max(200, "Maximum 200 chapters"),
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
  onSave?: (
    payload: Record<string, unknown>,
    meta?: { resolvedItems: Record<string, ResolvedItemState>; comment?: string },
  ) => Promise<unknown>;
  onCancel?: () => void;
  submitLabel?: string;
  resubmit?: { change: RequestedChange | null };
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
  resubmit,
}: ProposalWizardProps) {
  const isEdit = mode === "edit";
  const resubmitActive = isEdit && !!resubmit;
  const openChange = resubmit?.change ?? null;
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const busy = isSaving || isSubmitting;

  const [values, setValues] = useState<WizardValues>({
    title: initialProposal?.title ?? "",
    synopsis: initialProposal?.synopsis ?? "",
    genres: initialProposal?.genres ?? [],
    targetAudience: initialProposal?.targetAudience ?? "",
    chaptersPlanned: initialProposal?.chaptersPlanned ?? 24,
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
  const [submissionNote, setSubmissionNote] = useState(initialProposal?.submissionNote ?? "");
  const [originalWorkConfirmed, setOriginalWorkConfirmed] = useState(
    initialProposal?.originalWorkConfirmed ?? false,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof WizardValues, string>>>({});
  const [step2Error, setStep2Error] = useState<string | undefined>(undefined);
  const [resolvedItems, setResolvedItems] = useState<Record<string, ResolvedItemState>>({});
  const [revisionNote, setRevisionNote] = useState("");

  const step1Valid = useMemo(() => step1Schema.safeParse(values).success, [values]);
  const step2Valid = useMemo(
    () =>
      step2Schema.safeParse({ mainCharacters }).success &&
      (isEdit || (!!manuscript && storyboard.length > 0)),
    [isEdit, mainCharacters, manuscript, storyboard],
  );
  const checklistComplete = useMemo(() => {
    if (!resubmitActive || !openChange) return false;
    return openChange.items.every((item) => resolvedItems[item.id]?.resolved);
  }, [resubmitActive, openChange, resolvedItems]);
  const step3Valid = originalWorkConfirmed && (!resubmitActive || checklistComplete);
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
      chaptersPlanned: values.chaptersPlanned ?? 24,
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
        await onSave(
          payload,
          resubmitActive ? { resolvedItems, comment: revisionNote.trim() || undefined } : undefined,
        );
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
      if (resubmitActive && !checklistComplete) {
        toast.error("Please resolve all items in the Editor's checklist.");
      } else {
        toast.error("Please confirm original work ownership.");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        if (!onSave) throw new Error("Edit save handler is not configured.");
        await onSave(
          payload,
          resubmitActive ? { resolvedItems, comment: revisionNote.trim() || undefined } : undefined,
        );
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
    <div ref={topRef} className="space-y-6">
      <WizardStepper steps={STEPS} current={step} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Form Steps */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-xs backdrop-blur-md md:p-8">
            <div className="mb-6 flex items-center gap-2.5 border-b border-border/60 pb-4">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary font-bold text-xs text-primary-foreground shadow-2xs">
                {step}
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">{STEPS[step - 1].label}</h2>
                <p className="text-xs text-muted-foreground">{STEPS[step - 1].hint}</p>
              </div>
            </div>

            {step === 1 ? (
              <StepBasicPitch
                values={values}
                onChange={(p) => setValues((v) => ({ ...v, ...p }))}
                errors={errors}
              />
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
              <div className="space-y-4">
                {resubmitActive ? (
                  <div className="space-y-3">
                    <ResubmitChecklistEditor
                      change={openChange}
                      state={resolvedItems}
                      onChange={setResolvedItems}
                    />
                    <RevisionNotesField value={revisionNote} onChange={setRevisionNote} />
                  </div>
                ) : null}
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
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Live Pitch Preview, Checklist & Sticky Action Sidebar */}
        <div className="space-y-5 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 lg:self-start">
          {/* Live Poster & Pitch Preview Card */}
          <div className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Live Pitch Preview
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewOpen(true)}
                className="h-7 rounded-lg text-[11px] font-semibold gap-1.5 border-border/80 hover:bg-muted"
              >
                <Eye className="size-3.5 text-primary" />
                Full Preview
              </Button>
            </div>

            {/* Cover Upload Slot */}
            <div className="py-1">
              <CoverUpload
                value={coverUrl}
                fileKey={coverFileKey}
                onChange={({ url, fileKey }) => {
                  setCoverUrl(url);
                  setCoverFileKey(fileKey);
                }}
              />
            </div>

            {/* Live Meta */}
            <div className="space-y-2.5 border-t border-border/60 pt-3.5 text-center">
              <h3 className="font-serif text-lg font-bold text-foreground truncate">
                {values.title || "Untitled Series"}
              </h3>
              {values.logline ? (
                <p className="text-xs italic text-muted-foreground line-clamp-2 px-1">
                  "{values.logline}"
                </p>
              ) : (
                <p className="text-xs italic text-muted-foreground/60">Logline will appear here…</p>
              )}

              <div className="flex flex-wrap justify-center gap-1.5 pt-0.5">
                {values.genres.length > 0 ? (
                  values.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-md border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-2xs"
                    >
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground">No genres selected</span>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary tabular-nums">
                  {values.chaptersPlanned ?? 24} chapters planned
                </span>
                {values.targetAudience ? (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    {values.targetAudience}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Submission Readiness Checklist Card */}
          <Checklist step1Valid={step1Valid} step2Valid={step2Valid} step3Valid={step3Valid} />

          {/* Action Navigation Controls Card */}
          <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-xs backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2">
              {step === 1 && isEdit && onCancel ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={busy}
                  className="flex-1 rounded-xl"
                >
                  <ArrowLeft className="size-3.5" />
                  Cancel edit
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goBack}
                  disabled={step === 1 || busy}
                  className="flex-1 rounded-xl"
                >
                  <ArrowLeft className="size-3.5" />
                  Back
                </Button>
              )}

              {step < 3 ? (
                <Button
                  size="sm"
                  onClick={goNext}
                  disabled={busy}
                  className="flex-1 rounded-xl font-bold shadow-xs"
                >
                  Continue
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : null}
            </div>

            <div className="flex items-center gap-2 border-t border-border/60 pt-3">
              {!isEdit ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={busy}
                  className="w-full rounded-xl"
                >
                  {isSaving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  {isSaving ? "Saving…" : "Save draft"}
                </Button>
              ) : null}

              {step === 3 ? (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!allValid || busy}
                  className="w-full rounded-xl font-bold shadow-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  {isSubmitting
                    ? "Submitting…"
                    : isEdit
                      ? (submitLabel ?? "Save changes")
                      : "Submit to editor"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Pitch Preview Modal */}
      <PitchPreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        values={values}
        mainCharacters={mainCharacters}
        manuscript={manuscript}
        storyboard={storyboard}
        characterSheets={characterSheets}
        coverUrl={coverUrl}
      />
    </div>
  );
}

function PitchPreviewModal({
  open,
  onOpenChange,
  values,
  mainCharacters,
  manuscript,
  storyboard,
  characterSheets,
  coverUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: WizardValues;
  mainCharacters: string;
  manuscript: DraftManuscript | null;
  storyboard: DraftMaterial[];
  characterSheets: DraftMaterial[];
  coverUrl: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 rounded-2xl">
        <DialogHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
              Editorial Pitch Preview
            </span>
            <span className="text-xs text-muted-foreground">· Preview your pitch presentation</span>
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-foreground pt-1.5">
            {values.title || "Untitled Series"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12 items-start">
          {/* Cover & Quick Meta Column */}
          <div className="sm:col-span-4 space-y-3 text-center">
            {coverUrl ? (
              <div className="mx-auto max-w-[160px] overflow-hidden rounded-xl border border-border/80 shadow-md">
                <ResolvedImage
                  fallbackUrl={coverUrl}
                  alt="Cover preview"
                  className="aspect-[2/3] w-full object-cover"
                />
              </div>
            ) : (
              <div className="mx-auto flex aspect-[2/3] max-w-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-4 text-muted-foreground">
                <ImageIcon className="size-8 text-muted-foreground/60" />
                <span className="text-xs font-semibold">No cover image uploaded</span>
              </div>
            )}

            <div className="space-y-1 pt-1 text-xs">
              <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary tabular-nums">
                {values.chaptersPlanned ?? 24} chapters planned
              </span>
              {values.targetAudience ? (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pt-1">
                  Target: {values.targetAudience}
                </p>
              ) : null}
            </div>
          </div>

          {/* Pitch Details Column */}
          <div className="sm:col-span-8 space-y-4">
            {values.logline ? (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 italic text-xs text-foreground">
                "{values.logline}"
              </div>
            ) : null}

            {/* Genres */}
            {values.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-md border border-border/60 bg-card px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-2xs"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Synopsis
              </h4>
              <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap rounded-xl border border-border/60 bg-background/60 p-3.5 max-h-[180px] overflow-y-auto">
                {values.synopsis || "No synopsis provided yet."}
              </p>
            </div>

            {/* Characters */}
            {mainCharacters.trim() ? (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Main Characters
                </h4>
                <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap rounded-xl border border-border/60 bg-background/60 p-3.5 max-h-[140px] overflow-y-auto">
                  {mainCharacters}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Files Attached Section */}
        <div className="border-t border-border/60 pt-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Attached Files
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Manuscript */}
            <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sample Manuscript
              </span>
              {manuscript ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <FileText className="size-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-foreground truncate">
                    {manuscript.fileName}
                  </span>
                </div>
              ) : (
                <p className="text-xs italic text-rose-500 pt-0.5">Not uploaded yet</p>
              )}
            </div>

            {/* Storyboard */}
            <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Storyboard / Name
              </span>
              {storyboard.length > 0 ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <LayoutGrid className="size-4 text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground truncate">
                    {storyboard[0].fileName}
                  </span>
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground pt-0.5">
                  Optional (Not uploaded)
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold"
          >
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    { label: "Basic Pitch & Planned Chapters", done: step1Valid },
    { label: "Manuscript & Storyboard Upload", done: step2Valid },
    { label: "Original Work Confirmation", done: step3Valid },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-xs backdrop-blur-md space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Submission Readiness Checklist
      </p>
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.label}
            className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-colors ${
              it.done
                ? "border-emerald-500/30 bg-emerald-500/5 font-semibold text-emerald-700 dark:text-emerald-400"
                : "border-border/60 bg-muted/20 text-muted-foreground"
            }`}
          >
            {it.done ? (
              <Check className="size-4 shrink-0 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
            ) : (
              <span className="inline-block size-4 shrink-0 text-center font-bold text-muted-foreground/60">
                &bull;
              </span>
            )}
            <span className="truncate">{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
