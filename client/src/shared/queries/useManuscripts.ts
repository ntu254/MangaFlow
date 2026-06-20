import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { manuscriptsApi, type ManuscriptFile } from "@/shared/api/manuscripts";
import { extractErrorMessage } from "@/shared/api";

/**
 * Upload one manuscript file. If the backend endpoint does not exist yet
 * (404) we fall back to a local mock so the flow stays demoable.
 * TODO: remove the mock once the real endpoint is live.
 */
export function useUploadManuscript() {
  return useMutation({
    mutationFn: async ({
      seriesId,
      file,
      onProgress,
      category,
    }: {
      seriesId: string;
      file: File;
      onProgress?: (pct: number) => void;
      category?: string;
    }): Promise<ManuscriptFile> => {
      return await manuscriptsApi.upload(seriesId, file, onProgress, category);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useDeleteManuscript() {
  return useMutation({
    mutationFn: ({ seriesId, fileId }: { seriesId: string; fileId: string }) => {
      return manuscriptsApi.deleteFile(seriesId, fileId);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useGetManuscriptDownloadUrl() {
  return useMutation({
    mutationFn: ({ seriesId, fileId }: { seriesId: string; fileId: string }) => {
      return manuscriptsApi.getDownloadUrl(seriesId, fileId);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

/**
 * Verify on mount that every manuscript file still exists in storage and sync
 * the FileAsset status (ACTIVE/MISSING). Runs once when the tab opens so users
 * see "Missing from storage" without having to click preview first.
 */
export function useVerifyManuscriptFiles(seriesId: string, enabled = true) {
  return useQuery({
    queryKey: ["series", seriesId, "manuscripts", "verify"],
    queryFn: () => manuscriptsApi.verifyFiles(seriesId),
    enabled: !!seriesId && enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
