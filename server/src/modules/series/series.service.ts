import { z } from "zod";
import type { SeriesStatus, PublicationType } from "./series.model.js";
import type { SeriesMemberRole, SeriesMemberStatus } from "./series-member.model.js";

export type Series = {
  id: string;
  title: string;
  slug: string;
  description: string;
  genre: string[];
  coverUrl: string | null;
  ownerId: string;
  status: SeriesStatus;
  publicationType: PublicationType | null;
  createdAt: string;
  updatedAt: string;
};

export type SeriesMember = {
  id: string;
  seriesId: string;
  userId: string;
  role: SeriesMemberRole;
  status: SeriesMemberStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateSeriesInput = {
  title: string;
  description: string;
  genre?: string[];
  publicationType?: PublicationType;
  ownerId: string; // The user ID creating it
};

export type UpdateSeriesInput = {
  title?: string;
  description?: string;
  genre?: string[];
  publicationType?: PublicationType | null;
  status?: SeriesStatus;
};

export type SeriesRepository = {
  createSeries(data: {
    title: string;
    slug: string;
    description: string;
    genre: string[];
    publicationType: PublicationType | null;
    ownerId: string;
  }): Promise<Series>;
  findSeriesById(seriesId: string): Promise<Series | null>;
  findSeriesBySlug(slug: string): Promise<Series | null>;
  listSeriesForUser(userId: string): Promise<Series[]>;
  updateSeries(seriesId: string, data: UpdateSeriesInput): Promise<Series | null>;
  deleteSeries(seriesId: string): Promise<boolean>;
  getSeriesMemberRole(seriesId: string, userId: string): Promise<string | null>;
};

export class SeriesServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export function createSeriesService(seriesRepository: SeriesRepository) {
  return {
    async createSeries(input: CreateSeriesInput) {
      if (!input.title || input.title.trim().length === 0) {
        throw new SeriesServiceError("INVALID_TITLE", "Title is required");
      }

      // Generate a basic slug (in a real app, you might want to ensure uniqueness recursively)
      const baseSlug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${randomSuffix}`;

      return seriesRepository.createSeries({
        title: input.title,
        slug,
        description: input.description,
        genre: input.genre || [],
        publicationType: input.publicationType || null,
        ownerId: input.ownerId,
      });
    },

    async getSeriesById(seriesId: string) {
      const series = await seriesRepository.findSeriesById(seriesId);
      if (!series) {
        throw new SeriesServiceError("NOT_FOUND", "Series not found", 404);
      }
      return series;
    },

    async listUserSeries(userId: string) {
      return seriesRepository.listSeriesForUser(userId);
    },

    async updateSeries(seriesId: string, input: UpdateSeriesInput) {
      const series = await seriesRepository.updateSeries(seriesId, input);
      if (!series) {
        throw new SeriesServiceError("NOT_FOUND", "Series not found", 404);
      }
      return series;
    },

    async deleteSeries(seriesId: string, userId: string) {
      const series = await seriesRepository.findSeriesById(seriesId);
      if (!series) {
        throw new SeriesServiceError("NOT_FOUND", "Series not found", 404);
      }

      if (series.ownerId !== userId) {
        throw new SeriesServiceError("FORBIDDEN", "Only the owner can delete the series", 403);
      }

      if (series.status !== "DRAFT") {
        throw new SeriesServiceError("INVALID_STATUS", "Only DRAFT series can be deleted", 400);
      }

      const success = await seriesRepository.deleteSeries(seriesId);
      if (!success) {
        throw new SeriesServiceError("DELETE_FAILED", "Failed to delete series", 500);
      }

      return true;
    }
  };
}
