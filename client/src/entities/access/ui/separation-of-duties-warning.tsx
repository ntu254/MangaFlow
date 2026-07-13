import { AlertTriangle } from "lucide-react";
import { RESTRICTION_LABEL, type RestrictionCode } from "../model/access-labels";

export function SeparationOfDutiesWarning({
  reason,
  children,
}: {
  reason?: RestrictionCode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-semibold">Separation of Duties</p>
        <p className="mt-1">
          {children ??
            (reason
              ? RESTRICTION_LABEL[reason]
              : "This action requires separation-of-duties control.")}
        </p>
      </div>
    </div>
  );
}
