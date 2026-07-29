import { cn } from "@/shared/lib/cn";
import type { HTMLAttributes } from "react";
import { SURFACE_CLASSES } from "./panel";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(SURFACE_CLASSES, className)} {...props} />;
}
