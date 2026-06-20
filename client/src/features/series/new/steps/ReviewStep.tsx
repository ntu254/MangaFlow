import { useFormContext } from "react-hook-form";
import type { ManuscriptFile } from "@/shared/api/manuscripts";
import type { ProposalFormValues, WizardStep } from "../schema";
import { Field, textareaCls } from "./BasicInfoStep";

interface Props {
  manuscripts: ManuscriptFile[];
  onJump: (s: WizardStep) => void;
}

export function ReviewStep({ manuscripts, onJump }: Props) {
  const { register, watch } = useFormContext<ProposalFormValues>();
  const v = watch();

  return (
    <section className="space-y-5 rounded-2xl border border-foreground/10 bg-white dark:bg-card p-6 shadow-sm">
      <header>
        <h2 className="text-base font-semibold">Review & submit</h2>
        <p className="mt-0.5 text-[12px] text-foreground/55">
          Take one last look, then send it to your editor.
        </p>
      </header>

      <Summary
        title="Basic info"
        onEdit={() => onJump("basic")}
        rows={[
          ["Title", v.title || "—"],
          ["Logline", v.logline || "—"],
          ["Target audience", v.targetAudience || "—"],
          ["Genres", (v.genres ?? []).join(", ") || "—"],
          [
            "Preferred cadence",
            v.preferredCadence === "NONE" ? "No preference" : v.preferredCadence,
          ],
        ]}
      />

      <Summary
        title="Pitch"
        onEdit={() => onJump("pitch")}
        rows={[
          ["Synopsis", v.synopsis || "—"],
          ["Premise", v.premise || "—"],
          ["Characters", v.mainCharacters || "—"],
          ["Conflict", v.centralConflict || "—"],
        ]}
      />

      <Summary
        title="Manuscript"
        onEdit={() => onJump("manuscript")}
        rows={[
          [
            "Files",
            manuscripts.length === 0
              ? "None uploaded"
              : manuscripts.map((m) => m.name).join(", "),
          ],
        ]}
      />

      <Field label="Note to editor (optional)" hint="Anything you want to add.">
        <textarea
          {...register("editorNote")}
          maxLength={2000}
          rows={4}
          placeholder="Context, specific feedback you'd like, etc."
          className={textareaCls(false)}
        />
      </Field>
    </section>
  );
}

function Summary({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: [string, string][];
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl border border-foreground/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground/90">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-[11px] font-medium text-primary hover:underline"
        >
          Edit
        </button>
      </div>
      <dl className="space-y-1.5">
        {rows.map(([k, val]) => (
          <div key={k} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 text-[12px]">
            <dt className="text-foreground/50">{k}</dt>
            <dd className="text-foreground/85 break-words">{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
