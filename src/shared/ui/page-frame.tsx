import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export function PageFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={cn(
        "min-h-[calc(100vh-4rem)] bg-[var(--admin-page)] px-5 py-6 text-[var(--admin-ink)] lg:px-8",
        className,
      )}
    >
      {children}
    </main>
  );
}
