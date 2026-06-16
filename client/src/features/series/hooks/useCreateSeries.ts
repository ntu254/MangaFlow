import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  seriesApi,
  putToPresignedUrl,
  type CreateSeriesInput,
  type UpdateSeriesInput,
  type CreateManuscriptUploadInput,
  type SeriesUploadContentType,
} from "@/features/series/services/series.api"

export function useCreateSeries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSeriesInput) => {
      const { data } = await seriesApi.create(input)
      return data.data
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["series"] }),
    onError: () => toast.error("Failed to create series draft"),
  })
}

export function useSubmitSeries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (seriesId: string) => {
      const { data } = await seriesApi.submit(seriesId)
      return data.data
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["series"] }),
    onError: () => toast.error("Failed to submit series"),
  })
}

const CONTENT_TYPE_MAP: Record<string, SeriesUploadContentType> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "application/pdf": "application/pdf",
  "application/zip": "application/zip",
  "application/x-zip-compressed": "application/zip",
  "image/vnd.adobe.photoshop": "image/vnd.adobe.photoshop",
  "application/x-photoshop": "application/x-photoshop",
}

export function resolveUploadContentType(file: File): SeriesUploadContentType | null {
  return CONTENT_TYPE_MAP[file.type] ?? null
}

export interface UploadedFileResult {
  fileAssetId: string
  manuscriptId?: string
  originalName: string
  size: number
  contentType: SeriesUploadContentType
}

/**
 * Full upload flow for a single file:
 * 1. ask backend for a presigned upload URL (also persists a draft manuscript)
 * 2. PUT the file bytes directly to the presigned URL
 */
export function useUploadSeriesFile() {
  return useMutation({
    mutationFn: async ({
      seriesId,
      file,
      onProgress,
      assetType = "MANUSCRIPT",
      slot,
    }: {
      seriesId: string
      file: File
      onProgress?: (loaded: number, total: number) => void
      assetType?: "MANUSCRIPT" | "SUPPORTING"
      slot?: string
    }): Promise<UploadedFileResult> => {
      const contentType = resolveUploadContentType(file)
      if (!contentType) {
        throw new Error(`Unsupported file type: ${file.type || "unknown"}`)
      }

      const payload: CreateManuscriptUploadInput = {
        originalName: file.name,
        contentType,
        size: file.size,
        assetType,
        slot,
      }

      const { data } = await seriesApi.createManuscriptUpload(seriesId, payload)
      const { uploadUrl, fileAssetId, manuscriptId } = data.data

      await putToPresignedUrl(uploadUrl, file, onProgress)

      return {
        fileAssetId,
        manuscriptId,
        originalName: file.name,
        size: file.size,
        contentType,
      }
    },
  })
}

export function useUpdateSeries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ seriesId, input }: { seriesId: string; input: UpdateSeriesInput }) => {
      const { data } = await seriesApi.update(seriesId, input)
      return data.data
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["series"] }),
    onError: () => toast.error("Failed to save draft"),
  })
}
