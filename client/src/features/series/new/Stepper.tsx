import { Check, AlertCircle } from "lucide-react";
import type { WizardStep } from "./schema";

interface StepperProps {
  current: WizardStep;
  visited: Set<WizardStep>;
  completed: Record<WizardStep, boolean>;
  invalid: Set<WizardStep>;
  onJump: (step: WizardStep) => void;
}

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "basic", label: "Basic info" },
  { id: "pitch", label: "Pitch" },
  { id: "manuscript", label: "Manuscript" },
  { id: "review", label: "Review & submit" },
];

export function Stepper({
  current,
  visited,
  completed,
  invalid,
  onJump,
}: StepperProps) {
  return (
    <ol className="flex w-full min-w-max items-center justify-between gap-4 overflow-x-auto py-1">
      {STEPS.map((s, i) => {
        const isActive = current === s.id;
        const isDone = completed[s.id];
        const isInvalid = invalid.has(s.id);
        const canJump = visited.has(s.id) && !isActive;
        return (
          <li key={s.id} className="flex items-center gap-4">
            <button
              type="button"
              disabled={!canJump && !isActive}
              onClick={() => canJump && onJump(s.id)}
              className="flex items-center gap-2 group outline-none"
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all",
                  isInvalid
                    ? "bg-destructive text-destructive-foreground"
                    : isActive
                      ? "bg-foreground text-background shadow-sm"
                      : isDone
                        ? "bg-emerald-500 text-background"
                        : canJump
                          ? "bg-foreground/10 text-foreground/70 group-hover:bg-foreground/20"
                          : "bg-foreground/5 text-foreground/40",
                ].join(" ")}
              >
                {isInvalid ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : isDone && !isActive ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={[
                  "text-[12px] font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : isInvalid
                      ? "text-destructive"
                      : isDone
                        ? "text-foreground/80"
                        : canJump
                          ? "text-foreground/70 group-hover:text-foreground"
                          : "text-foreground/40",
                ].join(" ")}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className="h-[2px] w-8 shrink-0 rounded-full bg-foreground/10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
