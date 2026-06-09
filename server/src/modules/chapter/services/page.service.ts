import { AppError } from "../../../shared/errors/AppError.js"
import { createPageRepository, getPagesByChapter } from "../chapter.repository.js"

export async function createPageService(chapterId: string, pageNumber: number) {
  const trimmed = chapterId.trim()
  if (!trimmed) throw new AppError("Chapter id is required", 400)
  if (typeof pageNumber !== "number" || pageNumber < 1) throw new AppError("Valid page number is required", 400)
  try {
    return await createPageRepository(trimmed, pageNumber)
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Chapter not found")) throw new AppError("Chapter not found", 404)
    if (message.includes("already exists")) throw new AppError(message, 409)
    throw new AppError("Unable to create page", 400)
  }
}

export async function listPagesService(chapterId: string) {
  const trimmed = chapterId.trim()
  if (!trimmed) throw new AppError("Chapter id is required", 400)
  return getPagesByChapter(trimmed)
}
