import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ChevronLeft, ChevronRight, ChevronRight as Chevron } from "lucide-react";

import { useRole } from "@/shared/lib/role";
import { EmptyState, PageHeader } from "@/layouts/AppShell";
import { useCreateSeries, useUpdateSeries, useSubmitSeries } from "@/shared/queries/useSeries";
import type { CreateSeriesInput, UpdateSeriesInput } from "@/shared/api/series";

import { Stepper } from "@/features/series/new/Stepper";
import { ReadinessPanel } from "@/features/series/new/ReadinessPanel";
import { AutosaveIndicator } from "@/features/series/new/AutosaveIndicator";
import { MobileActionBar } from "@/features/series/new/MobileActionBar";
import {
  WIZARD_STEPS,
  fullProposalSchema,
  type ProposalFormValues,
  type WizardStep,
} from "@/features/series/new/schema";
import {
  useProposalForm,
  buildReadiness,
  isStepComplete,
  validateStep,
} from "@/features/series/new/useProposalForm";
import { BasicInfoStep } from "@/features/series/new/steps/BasicInfoStep";
import { PitchStep } from "@/features/series/new/steps/PitchStep";
import { ManuscriptStep } from "@/features/series/new/steps/ManuscriptStep";
import { ReviewStep } from "@/features/series/new/steps/ReviewStep";

const searchSchema = z.object({
  step: z.enum(WIZARD_STEPS).optional(),
  id: z.string().optional(),
});

export const Route = createFileRoute("/app/series/new")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: NewSeriesPage,
});

function NewSeriesPage() {
  const { role } = useRole();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const currentStep: WizardStep = search.step ?? "basic";

  const initialId = search.id ?? null;
  const {
    form,
    seriesId,
    setSeriesId,
    manuscripts,
    addManuscript,
    removeManuscript,
    autosaveStatus,
    lastSavedAt,
    hydrated,
    clearLocalDraft,
  } = useProposalForm(initialId);

  const createMut = useCreateSeries();
  const updateMut = useUpdateSeries();
  const submitMut = useSubmitSeries();

  const [visited, setVisited] = useState<Set<WizardStep>>(() => new Set([currentStep]));
  const [invalid, setInvalid] = useState<Set<WizardStep>>(new Set());
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  useEffect(() => {
    setVisited((p) => {
      if (p.has(currentStep)) return p;
      const next = new Set(p);
      next.add(currentStep);
      return next;
    });
  }, [currentStep]);

  const values = form.watch();
  const readiness = buildReadiness(values, manuscripts);
  const completed: Record<WizardStep, boolean> = {
    basic: isStepComplete("basic", values, manuscripts),
    pitch: isStepComplete("pitch", values, manuscripts),
    manuscript: isStepComplete("manuscript", values, manuscripts),
    review: isStepComplete("review", values, manuscripts),
  };

  // Auto-resume step if hydrated and no step in URL
  useEffect(() => {
    if (hydrated && !search.step) {
      let firstIncomplete: WizardStep = "basic";
      for (const step of WIZARD_STEPS) {
        if (!completed[step]) {
          firstIncomplete = step;
          break;
        }
      }
      if (firstIncomplete !== "basic") {
        navigate({
          to: "/app/series/new",
          search: (prev: any) => ({ ...prev, step: firstIncomplete }),
          replace: true,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, search.step]);

  // ---------- step navigation ----------

  const goTo = useCallback(
    (step: WizardStep) => {
      navigate({
        to: "/app/series/new",
        search: (prev: any) => ({ ...prev, step }),
        replace: true,
      });
    },
    [navigate],
  );

  const scrollToField = (name: string) => {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[name="${name}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }, 50);
  };

  const goNext = useCallback(async () => {
    const result = validateStep(currentStep, values);
    if (!result.ok) {
      setInvalid((p) => new Set(p).add(currentStep));
      await form.trigger();
      scrollToField(result.firstField);
      return;
    }
    setInvalid((p) => {
      const n = new Set(p);
      n.delete(currentStep);
      return n;
    });
    const idx = WIZARD_STEPS.indexOf(currentStep);
    if (idx < WIZARD_STEPS.length - 1) goTo(WIZARD_STEPS[idx + 1]);
  }, [currentStep, values, form, goTo]);

  const goPrev = useCallback(() => {
    const idx = WIZARD_STEPS.indexOf(currentStep);
    if (idx > 0) goTo(WIZARD_STEPS[idx - 1]);
  }, [currentStep, goTo]);

  // ---------- payload mapping ----------

  const buildPayload = useCallback(
    (v: ProposalFormValues): CreateSeriesInput => ({
      title: v.title,
      cover: v.cover || undefined,
      synopsis: v.synopsis || "TBD", // Provide default for draft creation
      logline: v.logline || undefined,
      premise: v.premise || undefined,
      characters: v.mainCharacters || undefined,
      conflict: v.centralConflict || undefined,
      targetAudience: v.targetAudience || undefined,
      requestedPublicationType:
        v.preferredCadence === "WEEKLY"
          ? "WEEKLY"
          : v.preferredCadence === "MONTHLY"
            ? "MONTHLY"
            : undefined,
      genres: v.genres,
    }),
    [],
  );

  // ---------- save draft ----------

  const ensureDraft = useCallback(async (): Promise<string | null> => {
    if (seriesId) return seriesId;
    const v = form.getValues();
    if (!v.title.trim()) return null;
    try {
      const created = await createMut.mutateAsync(buildPayload(v));
      setSeriesId(created.id);
      return created.id;
    } catch {
      return null;
    }
  }, [seriesId, form, createMut, buildPayload, setSeriesId]);

  const handleSaveDraft = useCallback(async () => {
    const v = form.getValues();
    if (!v.title.trim()) {
      toast.error("Add a title to save a draft.");
      return;
    }
    try {
      if (!seriesId) {
        const created = await createMut.mutateAsync(buildPayload(v));
        setSeriesId(created.id);
        toast.success("Draft saved");
      } else {
        await updateMut.mutateAsync({
          id: seriesId,
          input: buildPayload(v) as UpdateSeriesInput,
        });
        toast.success("Draft updated");
      }
    } catch {
      /* toast handled */
    }
  }, [seriesId, form, createMut, updateMut, buildPayload, setSeriesId]);

  // ---------- submit ----------

  const canSubmit =
    readiness.every((r) => r.done) &&
    !createMut.isPending &&
    !updateMut.isPending &&
    !submitMut.isPending;

  const canSaveDraft =
    values.title.trim().length > 0 &&
    !createMut.isPending &&
    !updateMut.isPending &&
    !submitMut.isPending;

  const handleSubmit = useCallback(async () => {
    const v = form.getValues();
    const parsed = fullProposalSchema.safeParse(v);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      const firstField = String(i.path[0]);
      // Try to map to a step
      const stepOf: Record<string, WizardStep> = {
        title: "basic",
        logline: "basic",
        targetAudience: "basic",
        genres: "basic",
        preferredCadence: "basic",
        synopsis: "pitch",
        premise: "pitch",
        mainCharacters: "pitch",
        centralConflict: "pitch",
      };
      const targetStep = stepOf[firstField] ?? "basic";
      setInvalid((p) => new Set(p).add(targetStep));
      if (currentStep !== targetStep) goTo(targetStep);
      await form.trigger();
      scrollToField(firstField);
      toast.error(i.message);
      return;
    }
    if (manuscripts.length === 0) {
      setInvalid((p) => new Set(p).add("manuscript"));
      if (currentStep !== "manuscript") goTo("manuscript");
      toast.error("Upload at least one manuscript file.");
      return;
    }

    let id = seriesId;
    try {
      if (!id) {
        const created = await createMut.mutateAsync(buildPayload(v));
        setSeriesId(created.id);
        id = created.id;
      } else {
        await updateMut.mutateAsync({
          id,
          input: buildPayload(v) as UpdateSeriesInput,
        });
      }
      const submitted = await submitMut.mutateAsync({
        id: id!,
        editorNote: v.editorNote || undefined,
      });
      clearLocalDraft();
      toast.success("Submitted for editor review");
      navigate({ to: "/app/series/$id", params: { id: submitted.id } });
    } catch {
      /* hook toasts */
    }
  }, [
    form,
    manuscripts.length,
    seriesId,
    createMut,
    updateMut,
    submitMut,
    buildPayload,
    setSeriesId,
    clearLocalDraft,
    navigate,
    currentStep,
    goTo,
  ]);

  // ---------- beforeunload guard ----------

  const isDirty = autosaveStatus === "dirty" || autosaveStatus === "saving";
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // ---------- role gate ----------

  if (role !== "mangaka" && role !== "admin") {
    return (
      <div>
        <PageHeader title="New series" description="Pitch a new title." />
        <EmptyState
          title="Only Mangaka can create new series"
          hint="Switch to a Mangaka account to start a new pitch."
        />
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="mx-auto flex h-[calc(100vh-100px)] w-full max-w-[1200px] flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-4 shrink-0 space-y-3">
          <nav className="flex items-center gap-1 text-[12px] text-foreground/55">
            <Link to="/app/series" className="hover:text-foreground/80">
              My Series
            </Link>
            <Chevron className="h-3 w-3" />
            <span className="text-foreground/80">New proposal</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">New Series</h1>
              <span className="inline-flex items-center rounded-md bg-foreground/10 px-2 py-0.5 text-[11px] font-semibold text-foreground/70">
                DRAFT
              </span>
            </div>
            {hydrated && <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} />}
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-6 shrink-0 overflow-x-auto">
          <Stepper
            current={currentStep}
            visited={visited}
            completed={completed}
            invalid={invalid}
            onJump={goTo}
          />
        </div>

        {/* Main grid */}
        <div className="grid min-h-0 flex-1 gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-y-auto pb-24 pr-1 md:pb-6">
            <ReadinessPanel
              status="DRAFT"
              readiness={readiness}
              canSaveDraft={canSaveDraft}
              canSubmit={canSubmit}
              isSaving={createMut.isPending || updateMut.isPending}
              isSubmitting={submitMut.isPending}
              onSaveDraft={handleSaveDraft}
              onSubmit={() => setConfirmSubmitOpen(true)}
              values={values}
              manuscripts={manuscripts}
              seriesId={seriesId}
              ensureDraft={ensureDraft}
              onAdd={addManuscript}
              onRemove={removeManuscript}
            />
          </aside>

          <div className="min-w-0 overflow-y-auto pb-24 pr-1 md:pb-6">
            <div className="mx-auto w-full max-w-[960px] space-y-6">
              {currentStep === "basic" && (
                <BasicInfoStep
                  seriesId={seriesId}
                  ensureDraft={ensureDraft}
                  manuscripts={manuscripts}
                  onAdd={addManuscript}
                  onRemove={removeManuscript}
                />
              )}
              {currentStep === "pitch" && <PitchStep />}
              {currentStep === "manuscript" && (
                <ManuscriptStep
                  seriesId={seriesId}
                  ensureDraft={ensureDraft}
                  manuscripts={manuscripts}
                  onAdd={addManuscript}
                  onRemove={removeManuscript}
                />
              )}
              {currentStep === "review" && <ReviewStep manuscripts={manuscripts} onJump={goTo} />}

              {/* Step nav */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={WIZARD_STEPS.indexOf(currentStep) === 0}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-foreground/15 px-3 text-[13px] font-medium text-foreground/70 hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                {currentStep !== "review" ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-foreground px-4 text-[13px] font-semibold text-background hover:opacity-90"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => canSubmit && setConfirmSubmitOpen(true)}
                    disabled={!canSubmit}
                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-foreground px-4 text-[13px] font-semibold text-background hover:opacity-90 disabled:opacity-40"
                  >
                    Submit for editor review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <MobileActionBar
          canSaveDraft={canSaveDraft}
          canSubmit={canSubmit}
          isSaving={createMut.isPending || updateMut.isPending}
          isSubmitting={submitMut.isPending}
          onSaveDraft={handleSaveDraft}
          onSubmit={() => setConfirmSubmitOpen(true)}
        />
      </div>

      {/* Confirm submit dialog */}
      {confirmSubmitOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur"
          onClick={() => !submitMut.isPending && setConfirmSubmitOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-foreground/10 bg-background p-5 shadow-xl"
          >
            <h3 className="text-base font-semibold">Submit for editor review?</h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              You won't be able to edit the proposal while your editor reviews it. They may request
              a revision, reject, or forward it to the Board.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                disabled={submitMut.isPending}
                className="h-9 rounded-lg border border-foreground/15 px-3 text-[13px] font-medium text-foreground/70 hover:bg-foreground/5"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmSubmitOpen(false);
                  void handleSubmit();
                }}
                disabled={submitMut.isPending}
                className="h-9 rounded-lg bg-foreground px-4 text-[13px] font-semibold text-background hover:opacity-90 disabled:opacity-50"
              >
                {submitMut.isPending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FormProvider>
  );
}
