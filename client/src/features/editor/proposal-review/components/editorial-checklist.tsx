import { useState } from "react";

type ChecklistKey =
  | "hook"
  | "characterMotivation"
  | "audienceFit"
  | "storyboardFlow"
  | "manuscriptQuality"
  | "serializePotential";

const CHECKLIST_LABEL: Record<ChecklistKey, string> = {
  hook: "Clear hook",
  characterMotivation: "The main character has clear motivation",
  audienceFit: "Good target-audience fit",
  storyboardFlow: "Storyboard/name is readable enough",
  manuscriptQuality: "Sample manuscript meets the minimum bar",
  serializePotential: "Has serialization potential",
};

const KEYS: ChecklistKey[] = [
  "hook",
  "characterMotivation",
  "audienceFit",
  "storyboardFlow",
  "manuscriptQuality",
  "serializePotential",
];

export function EditorialChecklist({ proposalId }: { proposalId: string }) {
  const [state, setState] = useState<Partial<Record<ChecklistKey, boolean>>>({});
  const passed = KEYS.filter((k) => state[k]).length;
  return (
    <div className="space-y-2 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Editorial checklist
        </p>
        <span className="text-[11px] text-muted-foreground">
          {passed}/{KEYS.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {KEYS.map((k) => (
          <li key={k} className="flex items-center gap-2">
            <input
              id={`chk-${proposalId}-${k}`}
              type="checkbox"
              checked={!!state[k]}
              onChange={(e) => setState((current) => ({ ...current, [k]: e.target.checked }))}
              className="size-3.5"
            />
            <label htmlFor={`chk-${proposalId}-${k}`} className="text-xs">
              {CHECKLIST_LABEL[k]}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
