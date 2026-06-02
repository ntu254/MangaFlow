import type { ChapterRepository } from "./chapter.repository.js";
import type { ChapterStatus } from "./chapter.model.js";

export type Chapter = {
  id: string;
  seriesId: string;
  title: string;
  chapterNumber: number;
  status: ChapterStatus;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateChapterInput = {
  seriesId: string;
  title: string;
  chapterNumber: number;
  deadline?: string;
};

export type UpdateChapterInput = {
  title?: string;
  chapterNumber?: number;
  status?: ChapterStatus;
  deadline?: string | null;
};

export class ChapterServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export function createChapterService(repository: ChapterRepository) {
  return {
    async createChapter(input: CreateChapterInput) {
      if (input.chapterNumber <= 0) {
        throw new ChapterServiceError("INVALID_CHAPTER_NUMBER", "Chapter number must be greater than 0");
      }
      if (!input.title || input.title.trim() === "") {
        throw new ChapterServiceError("INVALID_TITLE", "Chapter title is required");
      }

      try {
        return await repository.createChapter(input);
      } catch (err: any) {
        if (err.code === 11000) {
          throw new ChapterServiceError("DUPLICATE_CHAPTER_NUMBER", "Chapter number already exists in this series");
        }
        throw err;
      }
    },

    async listBySeries(seriesId: string) {
      return repository.findChaptersBySeries(seriesId);
    },

    async getById(chapterId: string) {
      const chapter = await repository.findById(chapterId);
      if (!chapter) {
        throw new ChapterServiceError("NOT_FOUND", "Chapter not found", 404);
      }
      return chapter;
    },

    async updateChapter(chapterId: string, input: UpdateChapterInput) {
      const chapter = await this.getById(chapterId);

      // Validate status transitions if status is updated
      if (input.status && input.status !== chapter.status) {
        this.validateStatusTransition(chapter.status, input.status);
      }

      if (input.chapterNumber !== undefined && input.chapterNumber <= 0) {
        throw new ChapterServiceError("INVALID_CHAPTER_NUMBER", "Chapter number must be greater than 0");
      }

      try {
        const updated = await repository.updateChapter(chapterId, input);
        if (!updated) {
          throw new ChapterServiceError("NOT_FOUND", "Chapter not found for update", 404);
        }
        return updated;
      } catch (err: any) {
        if (err.code === 11000) {
          throw new ChapterServiceError("DUPLICATE_CHAPTER_NUMBER", "Chapter number already exists in this series");
        }
        throw err;
      }
    },

    async deleteChapter(chapterId: string) {
      const chapter = await this.getById(chapterId);
      if (chapter.status !== "DRAFT") {
        throw new ChapterServiceError("INVALID_STATE", "Only DRAFT chapters can be deleted");
      }
      return repository.deleteChapter(chapterId);
    },

    validateStatusTransition(current: ChapterStatus, next: ChapterStatus) {
      const allowedTransitions: Record<ChapterStatus, ChapterStatus[]> = {
        DRAFT: ["IN_PROGRESS"],
        IN_PROGRESS: ["READY_FOR_EDITOR", "DRAFT"],
        READY_FOR_EDITOR: ["EDITOR_REVIEW", "IN_PROGRESS"],
        EDITOR_REVIEW: ["READY_FOR_PUBLICATION", "IN_PROGRESS"],
        READY_FOR_PUBLICATION: ["PUBLISHED", "EDITOR_REVIEW"],
        PUBLISHED: []
      };

      const allowed = allowedTransitions[current] || [];
      if (!allowed.includes(next)) {
        throw new ChapterServiceError(
          "INVALID_STATUS_TRANSITION",
          `Cannot transition chapter status from ${current} to ${next}`
        );
      }
    }
  };
}

export type ChapterService = ReturnType<typeof createChapterService>;
