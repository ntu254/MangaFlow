import { CheckCircle2, Circle, Loader2, Lock, ShieldCheck } from "lucide-react";
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
  const total = EDITORIAL_CHECKLIST_KEYS.length;
  const isComplete = passed === total;
  const percentage = Math.round((passed / total) * 100);

  return (
    <div className="space-y-3 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-xs backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Board Criteria</h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            isComplete
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }`}
        >
          {saving ? <Loader2 className="size-3 animate-spin" /> : null}
          {passed}/{total} ({percentage}%)
        </span>
      </div>

      {/* Progress Bar Gauge */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={`h-full transition-all duration-300 ${
            isComplete ? "bg-emerald-500" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {!editable ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          <Lock className="size-3 shrink-0" />
          <span className="truncate">Claim review to evaluate criteria.</span>
        </div>
      ) : null}

      <ul className="space-y-1.5">
        {EDITORIAL_CRITERIA.map((criterion) => {
          const checked = state[criterion.key];
          return (
            <li key={criterion.key}>
              <button
                type="button"
                disabled={!editable || saving}
                onClick={() => onChange({ ...state, [criterion.key]: !checked })}
                title={criterion.description}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all duration-150 ${
                  checked
                    ? "border-emerald-500/30 bg-emerald-500/5 text-foreground dark:border-emerald-500/30 dark:bg-emerald-950/20"
                    : "border-border/50 bg-background/40 text-muted-foreground hover:border-border hover:bg-background/80 hover:text-foreground"
                } disabled:cursor-not-allowed disabled:opacity-70`}
                aria-pressed={checked}
              >
                <span className="truncate text-xs font-medium">
                  {criterion.label}
                </span>

                {checked ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="size-3.5 shrink-0 text-muted-foreground/50" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {isComplete ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="size-3.5 shrink-0" />
          <span>All 6 criteria verified. Ready for Board.</span>
        </div>
      ) : (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          {total - passed} criteria remaining for Send to Board.
        </p>
      )}
    </div>
  );
}


