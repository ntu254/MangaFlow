import { AlertCircle, RefreshCw } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  message: string;
  retryText?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  retryText = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="text-center py-12 border border-dashed border-mf-rose-pink/30 rounded-2xl bg-mf-rose-pink/5">
      <AlertCircle className="mx-auto size-10 text-mf-rose-pink mb-3" />
      <p className="text-mf-text font-semibold text-sm">{title}</p>
      <p className="text-xs text-mf-text-muted mt-1 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-mf-primary border border-mf-border rounded-xl hover:bg-mf-bg-soft transition-colors"
        >
          <RefreshCw className="size-3.5" />
          {retryText}
        </button>
      )}
    </div>
  );
}
