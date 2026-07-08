import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

export const TextButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function TextButton({ children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] font-semibold text-[var(--admin-ink)] shadow-sm transition-colors hover:bg-[var(--admin-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

TextButton.displayName = "TextButton";
