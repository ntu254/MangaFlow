import { cn } from "@/shared/lib/cn";

export function Divider({ className }: { className?: string }) {
  return <div className={cn("my-7 h-px bg-[var(--admin-border)]", className)} />;
}
