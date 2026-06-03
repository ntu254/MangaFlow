import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 border border-dashed border-mf-border rounded-2xl bg-mf-bg-soft/50">
      {icon && <div className="mx-auto mb-3 text-mf-text-disabled">{icon}</div>}
      <p className="text-mf-text font-semibold text-sm">{title}</p>
      {description && (
        <p className="text-xs text-mf-text-muted mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
