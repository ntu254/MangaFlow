import React from "react";
import { ArrowRight } from "lucide-react";

interface WidgetCardProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
  actionPosition?: "top" | "bottom";
  className?: string;
  children: React.ReactNode;
}

export function WidgetCard({
  title,
  actionText,
  onAction,
  actionPosition = "top",
  className = "",
  children,
}: WidgetCardProps) {
  return (
    <section
      className={`rounded-xl border border-foreground/10 bg-card p-5 shadow-sm flex flex-col ${className}`}
    >
      <div
        className={`flex items-center justify-between ${actionPosition === "top" ? "mb-4" : "mb-4"}`}
      >
        <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
        {actionText && actionPosition === "top" && (
          <button
            onClick={onAction}
            className="flex items-center gap-1 text-[12px] font-medium text-foreground/60 hover:text-foreground transition-colors"
          >
            {actionText} <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="space-y-4 flex-1">{children}</div>

      {actionText && actionPosition === "bottom" && (
        <button
          onClick={onAction}
          className="mt-4 flex items-center gap-1 text-[12px] font-medium text-foreground/60 hover:text-foreground transition-colors self-start"
        >
          {actionText} <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </section>
  );
}
