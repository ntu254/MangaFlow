interface PageCardProps {
  page: {
    id: number;
    status: string;
    tasks?: number;
    time?: string;
  };
  variant?: "simple" | "detailed" | "thumbnail";
  onClick?: (id: number) => void;
  isSelected?: boolean;
}

export function PageCard({ page, variant = "detailed", onClick, isSelected }: PageCardProps) {
  const isApproved = page.status === "approved";
  const isUnderReview = page.status === "under-review";
  const isTaskAssigned = page.status === "task-assigned";

  if (variant === "simple") {
    return (
      <div
        onClick={() => onClick?.(page.id)}
        className="relative aspect-[3/4] rounded-md bg-foreground/5 border border-foreground/10 overflow-hidden group cursor-pointer"
      >
        {/* Subtle manga screentone texture overlay */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-multiply dark:mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "4px 4px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-foreground/30 font-black text-3xl group-hover:scale-110 transition-transform">
          {String(page.id).padStart(2, "0")}
        </div>
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm inline-block w-full text-center truncate ${
              isApproved
                ? "bg-emerald-500 text-white"
                : isUnderReview
                  ? "bg-sky-500 text-white"
                  : isTaskAssigned
                    ? "bg-amber-500 text-white"
                    : "bg-background/80 backdrop-blur-sm text-foreground"
            }`}
          >
            {page.status.replace("-", " ")}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "thumbnail") {
    return (
      <div
        onClick={() => onClick?.(page.id)}
        className={`relative aspect-[3/4] rounded-md overflow-hidden group cursor-pointer border ${isSelected ? "border-[#061A2B] ring-1 ring-[#061A2B]" : "border-foreground/10"}`}
      >
        <img
          src="https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=400&auto=format&fit=crop"
          alt={`Page ${page.id}`}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Number Badge */}
        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm min-w-[20px] text-center z-10">
          {page.id}
        </div>
        {/* Status Dot */}
        <div
          className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border border-white z-10 ${isApproved ? "bg-emerald-500" : isUnderReview ? "bg-blue-500" : isTaskAssigned ? "bg-orange-500" : "bg-white"}`}
        />
      </div>
    );
  }

  // Detailed variant (default)
  const badgeColor = isApproved
    ? "bg-emerald-500"
    : isUnderReview
      ? "bg-blue-500"
      : isTaskAssigned
        ? "bg-orange-500"
        : "bg-[#e5e1d8] text-foreground/60";

  return (
    <div
      onClick={() => onClick?.(page.id)}
      className={`group flex flex-col rounded-[8px] border bg-card cursor-pointer transition-all relative overflow-visible
        ${
          isSelected
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
            : "border-foreground/10 hover:border-foreground/20 hover:shadow-sm"
        }`}
    >
      <div className="aspect-[1.1] relative flex items-center justify-center p-2 rounded-t-[8px]">
        {/* Faint dotted background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none rounded-t-[8px]"
          style={{
            backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
            backgroundSize: "6px 6px",
          }}
        />
        <div className="text-[32px] font-black text-foreground/80 group-hover:scale-110 transition-transform duration-300">
          {String(page.id).padStart(2, "0")}
        </div>
      </div>

      {/* Badge slightly overlapping the divider */}
      <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-3 flex justify-center z-10">
        <div
          className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm w-full text-center truncate text-white ${badgeColor}`}
        >
          {page.status.replace("-", " ")}
        </div>
      </div>

      <div className="h-[1px] w-full bg-foreground/10 border-dashed border-t border-foreground/10 absolute top-[52%]" />

      <div className="p-2.5 pt-4 bg-card rounded-b-[8px] flex items-center justify-between mt-auto">
        <div className="text-[10px] font-semibold text-foreground/60">
          {page.tasks || 0} {(page.tasks || 0) === 1 ? "task" : "tasks"}
        </div>
        <div className="text-[10px] font-semibold text-foreground/40">{page.time || "-"}</div>
      </div>
    </div>
  );
}
