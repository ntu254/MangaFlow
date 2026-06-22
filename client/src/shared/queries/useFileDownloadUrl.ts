import { useQuery } from "@tanstack/react-query";
import { filesApi } from "../api/files";
import { qk } from "./keys";

export function useFileDownloadUrl(fileAssetId: string | undefined) {
  return useQuery({
    queryKey: qk.files.downloadUrl(fileAssetId),
    queryFn: async () => {
      const res = await filesApi.getPresignedDownloadUrl(fileAssetId!);
      return res.downloadUrl;
    },
    enabled: !!fileAssetId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}
