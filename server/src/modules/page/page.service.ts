import type { PageRepository } from "./page.repository.js";
import type { PageStatus } from "./page.model.js";

export type Page = {
  id: string;
  chapterId: string;
  pageNumber: number;
  originalFileUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  processedFileUrl?: string;
  width: number;
  height: number;
  currentVersion: number;
  status: PageStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreatePageInput = {
  chapterId: string;
  pageNumber: number;
  originalFileUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  processedFileUrl?: string;
  width?: number;
  height?: number;
};

export type UpdatePageInput = {
  pageNumber?: number;
  originalFileUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  processedFileUrl?: string;
  status?: PageStatus;
  currentVersion?: number;
};

export class PageServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export function createPageService(repository: PageRepository) {
  return {
    async createPage(input: CreatePageInput) {
      if (input.pageNumber <= 0) {
        throw new PageServiceError("INVALID_PAGE_NUMBER", "Page number must be greater than 0");
      }
      if (!input.originalFileUrl || input.originalFileUrl.trim() === "") {
        throw new PageServiceError("INVALID_FILE_URL", "Original file URL is required");
      }

      try {
        return await repository.createPage(input);
      } catch (err: any) {
        if (err.code === 11000) {
          throw new PageServiceError("DUPLICATE_PAGE_NUMBER", "Page number already exists in this chapter");
        }
        throw err;
      }
    },

    async listByChapter(chapterId: string) {
      return repository.findPagesByChapter(chapterId);
    },

    async getById(pageId: string) {
      const page = await repository.findById(pageId);
      if (!page) {
        throw new PageServiceError("NOT_FOUND", "Page not found", 404);
      }
      return page;
    },

    async updatePage(pageId: string, input: UpdatePageInput) {
      const page = await this.getById(pageId);

      if (input.status && input.status !== page.status) {
        this.validateStatusTransition(page.status, input.status);
      }

      if (input.pageNumber !== undefined && input.pageNumber <= 0) {
        throw new PageServiceError("INVALID_PAGE_NUMBER", "Page number must be greater than 0");
      }

      try {
        const updated = await repository.updatePage(pageId, input);
        if (!updated) {
          throw new PageServiceError("NOT_FOUND", "Page not found for update", 404);
        }
        return updated;
      } catch (err: any) {
        if (err.code === 11000) {
          throw new PageServiceError("DUPLICATE_PAGE_NUMBER", "Page number already exists in this chapter");
        }
        throw err;
      }
    },

    async deletePage(pageId: string) {
      // For safety, let's load first to verify it exists
      await this.getById(pageId);
      return repository.deletePage(pageId);
    },

    validateStatusTransition(current: PageStatus, next: PageStatus) {
      // Detailed page state transition check from docs:
      // UPLOADED -> AI_PROCESSED -> REGION_MARKED -> TASK_ASSIGNED -> IN_PROGRESS -> SUBMITTED -> MANGAKA_APPROVED -> EDITOR_APPROVED -> READY_TO_PUBLISH
      // Any review state -> NEEDS_REVISION
      // Let's define the allowable next states for each state
      const allowedTransitions: Record<PageStatus, PageStatus[]> = {
        UPLOADED: ["AI_PROCESSED", "REGION_MARKED", "NEEDS_REVISION"],
        AI_PROCESSED: ["REGION_MARKED", "NEEDS_REVISION"],
        REGION_MARKED: ["TASK_ASSIGNED", "NEEDS_REVISION"],
        TASK_ASSIGNED: ["IN_PROGRESS", "NEEDS_REVISION"],
        IN_PROGRESS: ["SUBMITTED", "NEEDS_REVISION"],
        SUBMITTED: ["MANGAKA_APPROVED", "NEEDS_REVISION"],
        MANGAKA_APPROVED: ["EDITOR_APPROVED", "NEEDS_REVISION"],
        EDITOR_APPROVED: ["READY_TO_PUBLISH", "NEEDS_REVISION"],
        NEEDS_REVISION: ["UPLOADED", "IN_PROGRESS", "AI_PROCESSED"],
        READY_TO_PUBLISH: []
      };

      const allowed = allowedTransitions[current] || [];
      if (!allowed.includes(next)) {
        throw new PageServiceError(
          "INVALID_STATUS_TRANSITION",
          `Cannot transition page status from ${current} to ${next}`
        );
      }
    }
  };
}

export type PageService = ReturnType<typeof createPageService>;
