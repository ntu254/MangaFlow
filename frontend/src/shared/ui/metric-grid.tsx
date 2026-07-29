import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function MetricGrid({
  columns = 4,
  children,
  className,
}: {
  columns?: 2 | 3 | 4 | 5;
  children: ReactNode;
  className?: string;
}) {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 xl:grid-cols-5",
  }[columns];

  return <section className={cn("grid gap-4", colClass, className)}>{children}</section>;
}
