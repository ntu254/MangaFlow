import { useQuery } from "@tanstack/react-query"
import { getEditorHistory } from "@/services/editor-mobile-data-source"

export function useEditorHistory() {
  return useQuery({
    queryKey: ["editor", "history"],
    queryFn: getEditorHistory,
  })
}
