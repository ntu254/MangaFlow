import { adminKeys } from "../../_shared";
import { adminApi } from "@/shared/api/services";
import { useQuery } from "@tanstack/react-query";

export interface AdminStorageSummaryAsset {
  id: string;
  title: string;
  owner: string;
  kind: string;
  sizeBytes: number;
  status: string;
  updatedAt?: string;
}

export interface AdminStorageSummary {
  totalAssets?: number;
  totalBytes?: number;
  indexedAssets?: number;
  orphanCount?: number;
  signedUrlOnlyCount?: number;
  assets?: AdminStorageSummaryAsset[];
}

export function useAdminStorageSummaryQuery(options: { enabled?: boolean } = {}) {
  return useQuery<AdminStorageSummary>({
    queryKey: adminKeys.storageSummary(),
    queryFn: () => adminApi.storageSummary() as Promise<AdminStorageSummary>,
    enabled: options.enabled ?? true,
    staleTime: 30000,
  });
}

import type { Material } from "../../_shared/api/admin-queries";

export function useAdminMaterialsQuery(options: { enabled?: boolean } = {}) {
  return useQuery<Material[]>({
    queryKey: adminKeys.materials(),
    queryFn: () => adminApi.materials() as Promise<Material[]>,
    enabled: options.enabled ?? true,
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUploadMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FormData) => adminApi.uploadMaterial(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.materials() });
      queryClient.invalidateQueries({ queryKey: adminKeys.storageSummary() });
    },
  });
}

export function useReplaceMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      adminApi.replaceMaterial(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.materials() });
      queryClient.invalidateQueries({ queryKey: adminKeys.storageSummary() });
    },
  });
}

export function useArchiveMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminApi.archiveMaterial(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.materials() });
      queryClient.invalidateQueries({ queryKey: adminKeys.storageSummary() });
    },
  });
}

export function useRestoreMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminApi.restoreMaterial(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.materials() });
      queryClient.invalidateQueries({ queryKey: adminKeys.storageSummary() });
    },
  });
}
