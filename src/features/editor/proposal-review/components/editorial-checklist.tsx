import {
  CHECKLIST_LABEL,
  useEditorAnnotations,
  type ChecklistKey,
} from "../../model/editor-annotations-store";

const KEYS: ChecklistKey[] = [
  "hook",
  "characterMotivation",
  "audienceFit",
  "storyboardFlow",
  "manuscriptQuality",
  "serializePotential",
];

const EMPTY_CHECKLIST = {};

export function EditorialChecklist({ proposalId }: { proposalId: string }) {
  const checklists = useEditorAnnotations((s) => s.checklists);
  const state = checklists[proposalId] ?? EMPTY_CHECKLIST;
  const toggle = useEditorAnnotations((s) => s.toggleChecklist);
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
              onChange={(e) => toggle(proposalId, k, e.target.checked)}
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
