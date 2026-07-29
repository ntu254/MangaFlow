import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type StepDef = { id: number; label: string; hint?: string };

export function WizardStepper({ steps, current }: { steps: StepDef[]; current: number }) {
  return (
    <ol className="flex w-full items-center gap-2">
      {steps.map((s, i) => {
        const state: "done" | "current" | "upcoming" =
          s.id < current ? "done" : s.id === current ? "current" : "upcoming";
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                state === "done" && "border-emerald-600 bg-emerald-600 text-white",
                state === "current" && "border-foreground bg-foreground text-background",
                state === "upcoming" && "border-border bg-background text-muted-foreground",
              )}
            >
              {state === "done" ? <Check className="size-3.5" /> : s.id}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-[11px] font-semibold uppercase tracking-widest",
                  state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {s.label}
              </p>
              {s.hint ? (
                <p className="truncate text-[10px] text-muted-foreground">{s.hint}</p>
              ) : null}
            </div>
            {i < steps.length - 1 ? (
              <div
                className={cn(
                  "hidden h-px flex-1 sm:block",
                  state === "done" ? "bg-emerald-600/60" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
