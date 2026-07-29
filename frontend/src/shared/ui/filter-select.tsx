import type { ReactNode } from "react";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/shared/lib/cn";

export function FilterSelect({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "h-10 w-[154px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
