import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ManuscriptFile } from "@/shared/api/manuscripts";
import {
  basicSchema,
  pitchSchema,
  fullProposalSchema,
  defaultProposalValues,
  type ProposalFormValues,
  type WizardStep,
} from "./schema";

export type AutosaveStatus = "idle" | "saving" | "saved" | "dirty";

interface PersistedDraft {
  values: ProposalFormValues;
  manuscripts: ManuscriptFile[];
  savedAt: number;
}

const draftKey = (seriesId: string | null) => `mangaflow:proposal-draft:${seriesId ?? "new"}`;

function readDraft(seriesId: string | null): PersistedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(draftKey(seriesId));
    if (!raw) return null;
    return JSON.parse(raw) as PersistedDraft;
  } catch {
    return null;
  }
}

function writeDraft(seriesId: string | null, draft: PersistedDraft) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(draftKey(seriesId), JSON.stringify(draft));
  } catch {
    /* quota — ignore */
  }
}

function clearDraft(seriesId: string | null) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(draftKey(seriesId));
}

export interface UseProposalFormResult {
  form: UseFormReturn<ProposalFormValues>;
  seriesId: string | null;
  setSeriesId: (id: string) => void;
  manuscripts: ManuscriptFile[];
  addManuscript: (f: ManuscriptFile) => void;
  removeManuscript: (id: string) => void;
  autosaveStatus: AutosaveStatus;
  lastSavedAt: number | null;
  hydrated: boolean;
  clearLocalDraft: () => void;
}

export function useProposalForm(initialSeriesId: string | null): UseProposalFormResult {
  const [seriesId, setSeriesIdState] = useState<string | null>(initialSeriesId);
  const [manuscripts, setManuscripts] = useState<ManuscriptFile[]>([]);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(fullProposalSchema),
    defaultValues: defaultProposalValues,
    mode: "onBlur",
  });

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    const draft = readDraft(initialSeriesId);
    if (draft) {
      // Strip removed fields (e.g. legacy `tags`) from persisted drafts
      const cleaned = { ...(draft.values as Record<string, unknown>) };
      delete cleaned.tags;
      form.reset({
        ...defaultProposalValues,
        ...(cleaned as Partial<ProposalFormValues>),
      });
      setManuscripts(draft.manuscripts ?? []);
      setLastSavedAt(draft.savedAt);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave to localStorage
  const watched = form.watch();
  const valuesJson = JSON.stringify(watched);
  const manuscriptsJson = JSON.stringify(manuscripts);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    setAutosaveStatus("dirty");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setAutosaveStatus("saving");
      const savedAt = Date.now();
      writeDraft(seriesId, {
        values: JSON.parse(valuesJson),
        manuscripts: JSON.parse(manuscriptsJson),
        savedAt,
      });
      setLastSavedAt(savedAt);
      setAutosaveStatus("saved");
    }, 1500);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [valuesJson, manuscriptsJson, seriesId, hydrated]);

  const setSeriesId = useCallback((id: string) => {
    setSeriesIdState((prev) => {
      if (prev === id) return prev;
      // Re-key local draft
      const draft = readDraft(prev);
      if (draft) {
        writeDraft(id, draft);
        clearDraft(prev);
      }
      return id;
    });
  }, []);

  const addManuscript = useCallback((f: ManuscriptFile) => {
    setManuscripts((prev) => [...prev, f]);
  }, []);

  const removeManuscript = useCallback((id: string) => {
    setManuscripts((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearLocalDraft = useCallback(() => {
    clearDraft(seriesId);
  }, [seriesId]);

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
}

// ---------- step / readiness helpers ----------

export interface ReadinessItem {
  key: "title" | "logline" | "synopsis" | "genre" | "manuscript";
  label: string;
  done: boolean;
  missingHint: string;
}

export function buildReadiness(
  v: ProposalFormValues,
  manuscripts: ManuscriptFile[],
): ReadinessItem[] {
  return [
    {
      key: "title",
      label: "Title",
      done: v.title.trim().length > 0,
      missingHint: "Add a title",
    },
    {
      key: "logline",
      label: "Logline",
      done: v.logline.trim().length > 0,
      missingHint: "Add a logline",
    },
    {
      key: "synopsis",
      label: "Synopsis",
      done: v.synopsis.trim().length > 0,
      missingHint: "Add a synopsis",
    },
    {
      key: "genre",
      label: "At least 1 genre",
      done: (v.genres ?? []).length > 0,
      missingHint: "Add at least one genre",
    },
    {
      key: "manuscript",
      label: "Proposal Materials uploaded",
      done: manuscripts.some(
        (m) => m.category === "PROPOSAL_PDF" || m.category === "SAMPLE_PAGE" || !m.category,
      ),
      missingHint: "Upload a PDF or Sample Pages",
    },
  ];
}

export function isStepComplete(
  step: WizardStep,
  v: ProposalFormValues,
  manuscripts: ManuscriptFile[],
): boolean {
  switch (step) {
    case "basic":
      return basicSchema.safeParse(v).success;
    case "pitch":
      return pitchSchema.safeParse(v).success;
    case "manuscript":
      return manuscripts.some(
        (m) => m.category === "PROPOSAL_PDF" || m.category === "SAMPLE_PAGE" || !m.category,
      );
    case "review":
      return (
        fullProposalSchema.safeParse(v).success &&
        manuscripts.some(
          (m) => m.category === "PROPOSAL_PDF" || m.category === "SAMPLE_PAGE" || !m.category,
        )
      );
  }
}

export function validateStep(
  step: WizardStep,
  v: ProposalFormValues,
): { ok: true } | { ok: false; firstField: string; message: string } {
  if (step === "basic") {
    const r = basicSchema.safeParse(v);
    if (r.success) return { ok: true };
    const i = r.error.issues[0];
    return { ok: false, firstField: String(i.path[0]), message: i.message };
  }
  if (step === "pitch") {
    const r = pitchSchema.safeParse(v);
    if (r.success) return { ok: true };
    const i = r.error.issues[0];
    return { ok: false, firstField: String(i.path[0]), message: i.message };
  }
  return { ok: true };
}
