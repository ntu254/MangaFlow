import { useMutation, useQueryClient } from "@tanstack/react-query";
import { regionsApi } from "../api/regions";
import { toast } from "sonner";
import { invalidatePageStudio } from "./keys";

export function useCreateRegion(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => regionsApi.createRegion(pageId, payload),
    onSuccess: () => {
      invalidatePageStudio(queryClient, pageId);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create region");
    },
  });
}

export function useUpdateRegion(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ regionId, payload }: { regionId: string; payload: any }) =>
      regionsApi.updateRegion(regionId, payload),
    onSuccess: () => {
      invalidatePageStudio(queryClient, pageId);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update region");
    },
  });
}

export function useDeleteRegion(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (regionId: string) => regionsApi.deleteRegion(regionId),
    onSuccess: () => {
      invalidatePageStudio(queryClient, pageId);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete region");
    },
  });
}
