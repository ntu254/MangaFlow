import { MangakaDashboard } from "@/features/mangaka";
import { useAuth } from "@/shared/auth";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

const DASHBOARD_BY_ROLE = {
  admin: "/app/admin/dashboard",
  assistant: "/app/assistant/dashboard",
  editor: "/app/editor/dashboard",
  board: "/app/board/dashboard",
} as const;

export function DashboardPage() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role === "mangaka") return;
    void navigate({ to: DASHBOARD_BY_ROLE[user.role], replace: true });
  }, [navigate, user]);

  if (!user) return null;
  if (user.role === "mangaka") return <MangakaDashboard />;

  return null;
}
