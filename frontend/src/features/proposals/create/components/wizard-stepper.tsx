import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type StepDef = { id: number; label: string; hint?: string };

export function WizardStepper({ steps, current }: { steps: StepDef[]; current: number }) {
  return (
    <ol className="flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-card/80 p-3 md:p-4 backdrop-blur-md shadow-xs">
      {steps.map((s, i) => {
        const state: "done" | "current" | "upcoming" =
          s.id < current ? "done" : s.id === current ? "current" : "upcoming";
        return (
          <li key={s.id} className="flex flex-1 items-center gap-3">
            <div
              className={cn(
                "flex size-8 flex-shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition-all shadow-2xs",
                state === "done" &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                state === "current" &&
                  "border-primary/50 bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20",
                state === "upcoming" && "border-border/60 bg-muted/30 text-muted-foreground",
              )}
            >
              {state === "done" ? <Check className="size-4 stroke-[2.5]" /> : s.id}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-xs font-bold tracking-tight",
                  state === "current" && "text-foreground",
                  state === "done" && "text-foreground/90",
                  state === "upcoming" && "text-muted-foreground",
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
                  "hidden h-0.5 flex-1 rounded-full sm:block transition-colors",
                  state === "done" ? "bg-emerald-500/40" : "bg-border/60",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
