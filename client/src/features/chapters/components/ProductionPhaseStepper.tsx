import { Check } from "lucide-react";
import {
  PHASE_LABEL,
  SUBSTATE_LABEL,
  type ProductionPhase,
  type ProductionSubstate,
} from "../lib/productionPhase";

const ORDER: ProductionPhase[] = ["draft", "in-production", "ready", "published"];

export function ProductionPhaseStepper({
  phase,
  substate,
}: {
  phase: ProductionPhase;
  substate: ProductionSubstate;
}) {
  const activeIdx = ORDER.indexOf(phase);
  return (
    <div className="mb-4 rounded-md border border-foreground/10 bg-card p-3">
      <ol className="flex items-center gap-2">
        {ORDER.map((p, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <li key={p} className="flex flex-1 items-center gap-2 min-w-0">
              <span
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-foreground/10 text-foreground/55"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-[12px] font-medium ${
                    active ? "text-foreground" : "text-foreground/70"
                  }`}
                >
                  {PHASE_LABEL[p]}
                </div>
                {active && substate && (
                  <div className="truncate text-[11px] text-foreground/55">
                    {SUBSTATE_LABEL[substate]}
                  </div>
                )}
              </div>
              {i < ORDER.length - 1 && (
                <span className="hidden h-px flex-1 bg-foreground/10 sm:block" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
