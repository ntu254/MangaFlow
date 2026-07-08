import type { Role } from "@/shared/auth";
import { ROLE_LABEL } from "@/shared/auth";
import { cn } from "@/shared/lib/cn";

const ROLE_CLASS: Record<Role, string> = {
  admin: "bg-role-admin/10 text-role-admin border-role-admin/25",
  mangaka: "bg-role-mangaka/10 text-role-mangaka border-role-mangaka/25",
  assistant: "bg-role-assistant/10 text-role-assistant border-role-assistant/25",
  editor: "bg-role-editor/10 text-role-editor border-role-editor/25",
  board: "bg-role-board/10 text-role-board border-role-board/25",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
        ROLE_CLASS[role],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {ROLE_LABEL[role]}
    </span>
  );
}
