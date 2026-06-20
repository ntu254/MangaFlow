import { Waves } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-current/40">
        <Waves className="h-4 w-4" strokeWidth={2.25} />
      </div>
      <span className="text-[15px] font-semibold tracking-tight">
        beach<span className="font-bold">Read</span>
      </span>
    </div>
  );
}
