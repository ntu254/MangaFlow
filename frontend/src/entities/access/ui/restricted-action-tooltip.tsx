import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RESTRICTION_LABEL, type RestrictionCode } from "../model/access-labels";

export function RestrictedActionTooltip({
  reason,
  children,
}: {
  reason?: RestrictionCode;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          {(reason && RESTRICTION_LABEL[reason]) ?? "Not supported in the MVP yet"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
