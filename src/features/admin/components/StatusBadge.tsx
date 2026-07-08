import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  active: "bg-teal-light text-teal",
  inactive: "bg-muted text-muted-foreground",
  premium: "bg-coral-light text-accent",
  free: "bg-muted text-muted-foreground",
  published: "bg-teal-light text-teal",
  draft: "bg-muted text-muted-foreground",
  new: "bg-coral-light text-accent",
  "in review": "bg-amber-50 text-amber-700",
  resolved: "bg-teal-light text-teal",
  featured: "bg-coral-light text-accent",
  hidden: "bg-muted text-muted-foreground",
  healthy: "bg-teal-light text-teal",
  broken: "bg-red-50 text-destructive",
  manual: "bg-muted text-muted-foreground",
  "ai scan": "bg-coral-light text-accent",
};

export function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body capitalize",
        variants[lower] || "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
