import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  acceptAISuggestion,
  getPageStudio,
  rejectAISuggestion,
  runAISegmentation,
  runAITextWhitening,
  type PageStudioResponse,
} from "../api/pages";
import { toast } from "sonner";

export function usePageStudio(pageId: string) {
  return useQuery<PageStudioResponse, Error>({
    queryKey: ["page", pageId, "studio"],
    queryFn: () => getPageStudio(pageId),
    enabled: Boolean(pageId),
  });
}

export function useRunAISegmentation(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => runAISegmentation(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", pageId, "studio"] });
      toast.success("AI segmentation completed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to run AI segmentation");
    },
  });
}

export function useRunAITextWhitening(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => runAITextWhitening(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", pageId, "studio"] });
      toast.success("AI text whitening completed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to whiten text");
    },
  });
}

export function useAcceptAISuggestion(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      aiResultId,
      suggestionIndex,
    }: {
      aiResultId: string;
      suggestionIndex: number;
    }) => acceptAISuggestion(aiResultId, suggestionIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", pageId, "studio"] });
      toast.success("AI suggestion accepted");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to accept AI suggestion");
    },
  });
}

export function useRejectAISuggestion(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      aiResultId,
      suggestionIndex,
    }: {
      aiResultId: string;
      suggestionIndex: number;
    }) => rejectAISuggestion(aiResultId, suggestionIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", pageId, "studio"] });
      toast.success("AI suggestion removed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove AI suggestion");
    },
  });
}
