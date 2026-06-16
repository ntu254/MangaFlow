import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { aiApi, chapterApi, fileApi, pageApi, regionApi, type Page, type Region, type AIResult } from "@/api/chapter"

export interface PageStudioData {
  page: Page & {
    originalFileAssetId?: { id?: string; _id?: string; originalName: string; mimeType: string; size: number; r2Key: string }
    workingFileAssetId?: { id?: string; _id?: string; originalName: string; mimeType: string; size: number; r2Key: string }
    thumbnailFileAssetId?: { id?: string; _id?: string; originalName: string; mimeType: string; size: number; r2Key: string }
  }
  workingFileAsset?: { id?: string; _id?: string; originalName: string; mimeType: string; size: number; r2Key: string }
  originalFileAsset?: { id?: string; _id?: string; originalName: string; mimeType: string; size: number; r2Key: string }
  thumbnailFileAsset?: { id?: string; _id?: string; originalName: string; mimeType: string; size: number; r2Key: string }
  regions: Region[]
  aiResults: AIResult[]
  tasks: Array<{ id: string; title: string; status: string; assignedTo?: string }>
  feedbackPoints: unknown[]
  collaborators: unknown[]
}

export function useChapterPages(chapterId: string | undefined) {
  return useQuery({
    queryKey: ["chapters", chapterId, "pages"],
    queryFn: async () => {
      if (!chapterId) throw new Error("No chapter ID")
      const { data } = await chapterApi.listPages(chapterId)
      return data.data
    },
    enabled: !!chapterId,
  })
}

export function usePageStudio(pageId: string | undefined) {
  return useQuery({
    queryKey: ["pages", pageId, "studio"],
    queryFn: async () => {
      if (!pageId) throw new Error("No page ID")
      const { data } = await pageApi.getStudio(pageId)
      return data.data as PageStudioData
    },
    enabled: !!pageId,
  })
}

export function usePageImageDownloadUrl(fileAssetId: string | undefined) {
  return useQuery({
    queryKey: ["files", fileAssetId, "download-url"],
    queryFn: async () => {
      if (!fileAssetId) throw new Error("No file asset ID")
      const { data } = await fileApi.getPresignedDownloadUrl(fileAssetId)
      return data.data
    },
    enabled: !!fileAssetId,
    staleTime: 1000 * 60 * 20,
  })
}

export function useCreateRegion(pageId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { type?: Region["type"]; bbox: Region["bbox"] }) => {
      if (!pageId) throw new Error("No page ID")
      const { data } = await regionApi.create(pageId, input)
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pages", pageId, "studio"] })
    },
  })
}

export function useRunAISegmentation(pageId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!pageId) throw new Error("No page ID")
      const { data } = await aiApi.segment(pageId)
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pages", pageId, "studio"] })
    },
  })
}

export function useAcceptAISuggestion(pageId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { aiResultId: string; suggestionIndex: number }) => {
      const { data } = await aiApi.acceptSuggestion(input.aiResultId, input.suggestionIndex)
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pages", pageId, "studio"] })
    },
  })
}

export function useRejectAISuggestion(pageId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { aiResultId: string; suggestionIndex: number }) => {
      const { data } = await aiApi.rejectSuggestion(input.aiResultId, input.suggestionIndex)
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pages", pageId, "studio"] })
    },
  })
}

