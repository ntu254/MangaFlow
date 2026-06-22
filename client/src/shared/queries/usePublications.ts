import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/shared/api";
import {
  publicationsApi,
  type CreatePublicationInput,
  type SchedulePublicationInput,
} from "@/shared/api/publications";

const PUBLICATIONS_KEY = ["publications"] as const;

export function usePublications(seriesId?: string) {
  return useQuery({
    queryKey: [...PUBLICATIONS_KEY, seriesId],
    queryFn: () => publicationsApi.list(seriesId),
  });
}

export function useCreatePublication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePublicationInput) => publicationsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PUBLICATIONS_KEY });
      toast.success("Publication created");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useSchedulePublication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicationId, scheduledFor }: { publicationId: string; scheduledFor: string }) =>
      publicationsApi.schedule(publicationId, { scheduledFor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PUBLICATIONS_KEY });
      toast.success("Publication rescheduled");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useCancelPublication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicationId: string) => publicationsApi.cancel(publicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PUBLICATIONS_KEY });
      toast.success("Publication cancelled");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function usePublishNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicationId: string) => publicationsApi.publish(publicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PUBLICATIONS_KEY });
      qc.invalidateQueries({ queryKey: ["series"] });
      toast.success("Chapter published!");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
