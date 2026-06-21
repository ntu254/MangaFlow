import { useMemo } from "react";
import type { Task } from "@/entities";
import { useMyTasks } from "@/shared/queries/useTasks";
import { normalizeStatus, type AssistantStatus } from "../lib/taskLifecycle";

export function useAssistantTasks(assistantId: string) {
  const query = useMyTasks();
  const mine = useMemo<Task[]>(() => query.data ?? [], [query.data]);

  const byStatus = useMemo(() => {
    const map: Record<AssistantStatus, Task[]> = {
      todo: [],
      "in-progress": [],
      submitted: [],
      "revision-requested": [],
      "mangaka-approved": [],
      "editor-approved": [],
      rejected: [],
      cancelled: [],
    };
    for (const t of mine) map[normalizeStatus(t.status)].push(t);
    return map;
  }, [mine]);

  const counts = useMemo(() => {
    const c: Record<AssistantStatus | "all", number> = {
      all: mine.length,
      todo: byStatus.todo.length,
      "in-progress": byStatus["in-progress"].length,
      submitted: byStatus.submitted.length,
      "revision-requested": byStatus["revision-requested"].length,
      "mangaka-approved": byStatus["mangaka-approved"].length,
      "editor-approved": byStatus["editor-approved"].length,
      rejected: byStatus.rejected.length,
      cancelled: byStatus.cancelled.length,
    };
    return c;
  }, [mine, byStatus]);

  return { mine, byStatus, counts, query, assistantId };
}
