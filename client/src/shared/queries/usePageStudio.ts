import { useQuery } from "@tanstack/react-query";
import { getPageStudio, type PageStudioResponse } from "../api/pages";

export function usePageStudio(pageId: string) {
  return useQuery<PageStudioResponse, Error>({
    queryKey: ["page", pageId, "studio"],
    queryFn: () => getPageStudio(pageId),
    enabled: Boolean(pageId),
  });
}
