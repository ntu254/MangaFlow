import { CheckCircle2, Circle, Loader2, Lock } from "lucide-react";
import type { EditorialChecklist as EditorialChecklistState } from "@/entities/proposal/model/proposal-types";
import { EDITORIAL_CHECKLIST_KEYS, EDITORIAL_CRITERIA } from "../model/editorial-checklist";

export function EditorialChecklist({
  value,
  editable,
  saving,
  onChange,
}: {
  value?: EditorialChecklistState;
  editable: boolean;
  saving: boolean;
  onChange: (next: EditorialChecklistState) => void;
}) {
  const state: EditorialChecklistState = {
    hook: value?.hook === true,
    characterMotivation: value?.characterMotivation === true,
    audienceFit: value?.audienceFit === true,
    storyboardFlow: value?.storyboardFlow === true,
    manuscriptQuality: value?.manuscriptQuality === true,
    serializePotential: value?.serializePotential === true,
  };
  const passed = EDITORIAL_CHECKLIST_KEYS.filter((key) => state[key]).length;

  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Board readiness
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            All six criteria are required only for Send to Board.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
            passed === EDITORIAL_CHECKLIST_KEYS.length
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {saving ? <Loader2 className="size-3 animate-spin" /> : null}
          {passed}/{EDITORIAL_CHECKLIST_KEYS.length}
        </span>
      </div>

      {!editable ? (
        <div className="flex items-center gap-1.5 rounded border border-border bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">
          <Lock className="size-3" />
          Claim this review to evaluate and save these criteria.
        </div>
      ) : null}

      <ul className="space-y-2">
        {EDITORIAL_CRITERIA.map((criterion) => {
          const checked = state[criterion.key];
          return (
            <li key={criterion.key}>
              <button
                type="button"
                disabled={!editable || saving}
                onClick={() => onChange({ ...state, [criterion.key]: !checked })}
                className="flex w-full items-start gap-2 rounded border border-border bg-background p-2.5 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-70"
                aria-pressed={checked}
              >
                {checked ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className="block text-xs font-semibold">{criterion.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                    {criterion.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {passed < EDITORIAL_CHECKLIST_KEYS.length ? (
        <p className="text-[11px] font-medium text-amber-800">
          {EDITORIAL_CHECKLIST_KEYS.length - passed} criteria remaining before this proposal can be
          sent to the Board.
        </p>
      ) : (
        <p className="text-[11px] font-medium text-emerald-700">
          Editorial review is complete. Send to Board is now available.
        </p>
      )}
    </div>
  );
}
