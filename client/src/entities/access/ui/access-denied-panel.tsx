import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

export function AccessDeniedPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="space-y-3">
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-amber-900/80">{description}</p>
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
