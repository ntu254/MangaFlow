import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export function NoAccessView({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-12 max-w-md rounded-md border border-foreground/10 bg-card p-8 text-center">
      <Lock className="mx-auto mb-3 h-8 w-8 text-foreground/40" />
      <h2 className="text-base font-semibold">Restricted view</h2>
      <p className="mt-2 text-[12px] text-foreground/55">{message}</p>
      <Link
        to="/app"
        className="mt-4 inline-flex h-8 items-center rounded-md border border-foreground/15 px-3 text-[12px] hover:bg-foreground/5"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
