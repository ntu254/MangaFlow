import { AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { RESTRICTION_LABEL, type RestrictionCode } from "../model/access-labels";

export function SeparationOfDutiesWarning({
  reason,
  children,
  className,
  variant = "default",
}: {
  reason?: RestrictionCode;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "admin";
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-md p-3 text-xs",
        variant === "default" && "rounded-md border border-amber-300 bg-amber-50 text-amber-950",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-semibold">Separation of Duties</p>
        <p className="mt-1">
          {children ??
            (reason
              ? RESTRICTION_LABEL[reason]
              : "This action requires separation-of-duties controls.")}
        </p>
      </div>
    </div>
  );
}
