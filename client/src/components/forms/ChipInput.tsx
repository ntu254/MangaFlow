import { useState, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
  maxLen?: number;
};

export function ChipInput({
  value,
  onChange,
  placeholder = "Type and press Enter…",
  suggestions = [],
  max = 20,
  maxLen = 40,
}: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const v = raw.trim().slice(0, maxLen);
    if (!v) return;
    if (value.includes(v)) return;
    if (value.length >= max) return;
    onChange([...value, v]);
    setDraft("");
  };

  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = suggestions.filter((s) => !value.includes(s));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-foreground/15 bg-foreground/5 p-1.5 focus-within:ring-2 focus-within:ring-primary/40">
        {value.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[12px] text-primary"
          >
            {chip}
            <button
              type="button"
              onClick={() => remove(chip)}
              className="grid h-3.5 w-3.5 place-items-center rounded-full hover:bg-primary/20"
              aria-label={`Remove ${chip}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => draft && add(draft)}
          placeholder={value.length >= max ? `Max ${max} reached` : placeholder}
          disabled={value.length >= max}
          maxLength={maxLen}
          className="min-w-[120px] flex-1 bg-transparent px-2 py-1 text-sm outline-none disabled:opacity-50"
        />
      </div>
      {remaining.length > 0 && value.length < max && (
        <div className="flex flex-wrap gap-1.5">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-foreground/15 px-2 py-0.5 text-[11px] text-foreground/70 hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-2.5 w-2.5" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
