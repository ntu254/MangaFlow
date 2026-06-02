import type { ManuscriptRepository } from "./manuscript.repository.js";
import type { ManuscriptStatus } from "./manuscript.model.js";

export type Manuscript = {
  id: string;
  seriesId: string;
  uploadedBy: string;
  title?: string;
  description?: string;
  fileUrls: string[];
  previewUrls?: string[];
  currentVersion: number;
  status: ManuscriptStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateManuscriptInput = {
  seriesId: string;
  title?: string;
  description?: string;
  fileUrls: string[];
};

export class ManuscriptServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export function createManuscriptService(repository: ManuscriptRepository) {
  return {
    async createManuscript(input: CreateManuscriptInput, uploaderId: string) {
      if (!input.fileUrls || input.fileUrls.length === 0) {
        throw new ManuscriptServiceError("NO_FILES", "A manuscript must contain at least one file");
      }
      return repository.createManuscript({ ...input, uploadedBy: uploaderId });
    },

    async listBySeries(seriesId: string) {
      return repository.findManuscriptsBySeries(seriesId);
    },

    async getById(manuscriptId: string) {
      const manuscript = await repository.findById(manuscriptId);
      if (!manuscript) {
        throw new ManuscriptServiceError("NOT_FOUND", "Manuscript not found", 404);
      }
      return manuscript;
    },

    async submitManuscript(manuscriptId: string) {
      const manuscript = await this.getById(manuscriptId);
      if (manuscript.status !== "DRAFT" && manuscript.status !== "REVISION_REQUESTED") {
        throw new ManuscriptServiceError("INVALID_STATE", "Only DRAFT or REVISION_REQUESTED manuscripts can be submitted");
      }
      return repository.updateStatus(manuscriptId, "SUBMITTED");
    },

    async startEditorReview(manuscriptId: string) {
      const manuscript = await this.getById(manuscriptId);
      if (manuscript.status !== "SUBMITTED") {
        throw new ManuscriptServiceError("INVALID_STATE", "Only SUBMITTED manuscripts can be reviewed");
      }
      return repository.updateStatus(manuscriptId, "EDITOR_REVIEW");
    },

    async approveManuscript(manuscriptId: string) {
      const manuscript = await this.getById(manuscriptId);
      if (manuscript.status !== "EDITOR_REVIEW") {
        throw new ManuscriptServiceError("INVALID_STATE", "Only manuscripts in EDITOR_REVIEW can be approved");
      }
      return repository.updateStatus(manuscriptId, "APPROVED");
    },

    async requestRevision(manuscriptId: string) {
      const manuscript = await this.getById(manuscriptId);
      if (manuscript.status !== "EDITOR_REVIEW") {
        throw new ManuscriptServiceError("INVALID_STATE", "Only manuscripts in EDITOR_REVIEW can be sent for revision");
      }
      return repository.updateStatus(manuscriptId, "REVISION_REQUESTED");
    }
  };
}
