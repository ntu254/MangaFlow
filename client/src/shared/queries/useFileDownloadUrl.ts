import { useQuery } from "@tanstack/react-query";
import { filesApi } from "../api/files";

export function useFileDownloadUrl(fileAssetId: string | undefined) {
  return useQuery({
    queryKey: ["file-download-url", fileAssetId],
    queryFn: async () => {
      const res = await filesApi.getPresignedDownloadUrl(fileAssetId!);
      // Ensure we extract the URL correctly from the response structure
      // e.g. { success: true, data: { url: "..." } } or similar
      return res?.data?.url || res?.data || res;
    },
    enabled: !!fileAssetId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}
