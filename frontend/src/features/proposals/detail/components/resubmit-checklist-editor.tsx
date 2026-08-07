import type { RequestedChange } from "@/entities/proposal/model/proposal-types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type ResolvedItemState = { resolved: boolean; response?: string };

export function ResubmitChecklistEditor({
  change,
  state,
  onChange,
}: {
  change: RequestedChange | null;
  state: Record<string, ResolvedItemState>;
  onChange: (state: Record<string, ResolvedItemState>) => void;
}) {
  if (!change) {
    return (
      <p className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground">
        No open revision checklist found.
      </p>
    );
  }

  const setItem = (id: string, patch: Partial<ResolvedItemState>) => {
    onChange({
      ...state,
      [id]: { ...(state[id] ?? { resolved: false }), ...patch },
    });
  };

  return (
    <section className="rounded border border-amber-200 bg-amber-50/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-900">
        Checklist from Editor — {change.editorName}
      </p>
      {change.comment ? <p className="mt-1 text-xs text-amber-900/80">{change.comment}</p> : null}
      <ul className="mt-3 space-y-2">
        {change.items.map((item) => {
          const itemState = state[item.id] ?? { resolved: false };
          return (
            <li key={item.id} className="rounded border border-border bg-background p-3 text-xs">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={itemState.resolved}
                  onChange={(event) => setItem(item.id, { resolved: event.target.checked })}
                  className="mt-0.5"
                />
                <span className="flex-1">{item.text}</span>
              </label>
              <Textarea
                rows={2}
                className="mt-2 text-xs"
                placeholder="How did you address this item..."
                value={itemState.response ?? ""}
                onChange={(event) => setItem(item.id, { response: event.target.value })}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RevisionNotesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Revision notes</Label>
      <Textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Summarize the main changes..."
      />
    </div>
  );
}
