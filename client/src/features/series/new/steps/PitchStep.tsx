import { useFormContext } from "react-hook-form";
import type { ProposalFormValues } from "../schema";
import { Field, textareaCls } from "./BasicInfoStep";

export function PitchStep() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ProposalFormValues>();
  const v = watch();

  return (
    <section className="space-y-5 rounded-2xl border border-foreground/10 bg-white dark:bg-card p-6 shadow-sm">
      <header>
        <h2 className="text-base font-semibold">The pitch</h2>
        <p className="mt-0.5 text-[12px] text-foreground/55">
          What your editor will read first.
        </p>
      </header>

      <Field
        label="Synopsis"
        required
        hint="Setting, protagonist, stakes, arc."
        error={errors.synopsis?.message}
        counter={`${(v.synopsis ?? "").length}/2000`}
      >
        <textarea
          {...register("synopsis")}
          maxLength={2000}
          rows={7}
          placeholder="Tell the full story summary here…"
          className={textareaCls(!!errors.synopsis)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Premise"
          counter={`${(v.premise ?? "").length}/2000`}
          error={errors.premise?.message}
        >
          <textarea
            {...register("premise")}
            maxLength={2000}
            rows={4}
            placeholder="The core hook."
            className={textareaCls(!!errors.premise)}
          />
        </Field>
        <Field
          label="Main characters"
          counter={`${(v.mainCharacters ?? "").length}/2000`}
          error={errors.mainCharacters?.message}
        >
          <textarea
            {...register("mainCharacters")}
            maxLength={2000}
            rows={4}
            placeholder="Protagonist, antagonist, supporting cast — one line each."
            className={textareaCls(!!errors.mainCharacters)}
          />
        </Field>
      </div>

      <Field
        label="Central conflict"
        counter={`${(v.centralConflict ?? "").length}/2000`}
        error={errors.centralConflict?.message}
      >
        <textarea
          {...register("centralConflict")}
          maxLength={2000}
          rows={3}
          placeholder="What's at stake? Who opposes whom?"
          className={textareaCls(!!errors.centralConflict)}
        />
      </Field>
    </section>
  );
}
