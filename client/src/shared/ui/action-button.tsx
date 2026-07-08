import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "danger" | "readonly" | "success";
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  { tone = "secondary", className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[6px] border px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
        tone === "primary" &&
          "border-[var(--admin-navy)] bg-[var(--admin-navy)] text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]",
        tone === "secondary" &&
          "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-ink)] hover:bg-[var(--admin-hover)]",
        tone === "danger" && "border-rose-600 bg-rose-600 text-white hover:bg-rose-700",
        tone === "readonly" &&
          "border-[var(--admin-border)] bg-[var(--admin-hover)]/40 text-[var(--admin-faint)] shadow-none",
        tone === "success" && "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

ActionButton.displayName = "ActionButton";
