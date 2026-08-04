import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUDIENCE_LABEL, GENRE_OPTIONS } from "@/entities/proposal/model/proposal-types";
import type { WizardValues } from "../proposal-wizard";

type Props = {
  values: WizardValues;
  onChange: (patch: Partial<WizardValues>) => void;
  errors: Partial<Record<keyof WizardValues, string>>;
};

export function StepBasicPitch({ values, onChange, errors }: Props) {
  const toggleGenre = (g: string) => {
    const on = values.genres.includes(g);
    if (!on && values.genres.length >= 4) return;
    onChange({ genres: on ? values.genres.filter((x) => x !== g) : [...values.genres, g] });
  };

  return (
    <div className="space-y-6">
      <Field label="Series title" error={errors.title} hint="At least 3 characters" required>
        <Input
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Iron Coast"
        />
      </Field>

      <Field label="Logline" error={errors.logline} hint={`${values.logline.length} / 200`}>
        <Input
          value={values.logline}
          onChange={(e) => onChange({ logline: e.target.value })}
          placeholder="One sentence — who, what, and what's at stake?"
          maxLength={220}
        />
        <p className="text-[10px] text-muted-foreground">
          A short hook that captures the essence of the series.
        </p>
      </Field>

      <Field
        label="Synopsis"
        error={errors.synopsis}
        hint={`${values.synopsis.length} / 2 000`}
        required
      >
        <Textarea
          rows={6}
          value={values.synopsis}
          onChange={(e) => onChange({ synopsis: e.target.value })}
          placeholder="Describe the plot, main characters, and world (minimum 80 characters)."
        />
      </Field>

      <Field label="Genres" error={errors.genres} hint={`${values.genres.length} / 4`} required>
        <div className="flex flex-wrap gap-1.5">
          {GENRE_OPTIONS.map((g) => {
            const on = values.genres.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground/70 hover:bg-muted"}`}
              >
                {g}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Select 1–4 genres that best describe your series.
        </p>
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Target audience" error={errors.targetAudience} required>
          <Select
            value={values.targetAudience ?? ""}
            onValueChange={(v) => onChange({ targetAudience: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select target audience" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AUDIENCE_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Planned chapters"
          error={errors.chaptersPlanned}
          hint="Total chapters planned for this series"
          required
        >
          <Input
            type="number"
            min={1}
            max={200}
            value={values.chaptersPlanned ?? 24}
            onChange={(e) =>
              onChange({ chaptersPlanned: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }
            placeholder="e.g. 24"
          />
        </Field>
      </div>

      <Field label="Hook / selling point" error={errors.hook} hint={`${values.hook.length} / 280`}>
        <Textarea
          rows={3}
          value={values.hook}
          onChange={(e) => onChange({ hook: e.target.value })}
          placeholder="What makes this series unique? Why should readers keep reading?"
          maxLength={300}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </Label>
        {hint ? <span className="text-[10px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
