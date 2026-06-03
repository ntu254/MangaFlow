import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  message?: string;
  variant?: "page" | "card" | "table" | "button";
};

export function LoadingState({ message = "Loading...", variant = "page" }: LoadingStateProps) {
  if (variant === "page") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-sm text-mf-text-muted">
          <Loader2 className="size-8 animate-spin text-mf-primary" />
          <span>{message}</span>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="animate-pulse bg-mf-bg-soft rounded-2xl aspect-[3/4] w-full" />
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-mf-bg-soft rounded-xl h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-mf-text-muted">
      <Loader2 className="size-4 animate-spin text-mf-primary" />
      <span>{message}</span>
    </div>
  );
}
