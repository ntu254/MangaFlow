import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/shared/api";
import type { Role } from "@/shared/lib/role";
import { qk } from "./keys";

export function useDashboard(role: Role, enabled: boolean = true) {
  return useQuery({
    queryKey: qk.dashboard.byRole(role),
    enabled,
    queryFn: () => {
      switch (role) {
        case "admin":
          return dashboardApi.admin();
        case "mangaka":
          return dashboardApi.mangaka();
        case "editor":
          return dashboardApi.editor();
        case "assistant":
          return dashboardApi.assistant();
        case "board":
          return dashboardApi.board();
      }
    },
  });
}
