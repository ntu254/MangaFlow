import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RESTRICTION_LABEL, type RestrictionCode } from "../model/access-labels";

export function RestrictedActionTooltip({
  reason = "CALLBACK_MISSING",
  children,
}: {
  reason?: RestrictionCode;
  children: ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{RESTRICTION_LABEL[reason] ?? "Not supported in the MVP"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
