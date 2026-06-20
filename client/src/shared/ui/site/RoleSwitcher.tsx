import { useRole, ROLES, roleMeta } from "@/shared/lib/role";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const m = roleMeta(role);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-2.5 text-xs text-foreground/80 hover:text-foreground"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="font-medium">{m.label}</span>
        <span className="font-jp text-foreground/50">· {m.jp}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-md border border-foreground/10 bg-popover shadow-lg">
          <div className="border-b border-foreground/10 px-3 py-2 text-[10px] uppercase tracking-wider text-foreground/55">
            Switch role (demo)
          </div>
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setRole(r.id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-accent ${
                r.id === role ? "bg-accent/60 font-medium" : ""
              }`}
            >
              <span>{r.label}</span>
              <span className="font-jp text-foreground/50">{r.jp}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
