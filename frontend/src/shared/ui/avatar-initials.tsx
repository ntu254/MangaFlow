import { cn } from "@/shared/lib/cn";

export function AvatarInitials({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-[var(--admin-navy)] text-[12px] font-bold text-[var(--admin-cream)]",
        className,
      )}
    >
      {name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </div>
  );
}
