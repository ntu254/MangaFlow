import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/shared/api/tasks";

export function useTasksBySeries(seriesId: string) {
  return useQuery({
    queryKey: ["tasks", "series", seriesId],
    queryFn: () => tasksApi.listBySeries(seriesId),
    enabled: !!seriesId,
  });
}
