import { describe, expect, it, vi } from "vitest";
import { createSeriesService, SeriesServiceError, type Series, type SeriesRepository } from "./series.service.js";

const now = "2026-06-03T00:00:00.000Z";

function createSeries(overrides: Partial<Series> = {}): Series {
  return {
    id: overrides.id ?? "series_1",
    title: overrides.title ?? "Moon Ink",
    slug: overrides.slug ?? "moon-ink-fixed",
    description: overrides.description ?? "A studio workflow manga.",
    genre: overrides.genre ?? ["Drama"],
    coverUrl: overrides.coverUrl ?? null,
    ownerId: overrides.ownerId ?? "user_owner",
    status: overrides.status ?? "DRAFT",
    publicationType: overrides.publicationType ?? "WEEKLY",
    createdAt: now,
    updatedAt: now
  };
}

function createRepository(seed: Series[] = []) {
  const seriesById = new Map(seed.map((series) => [series.id, series]));
  const createdPayloads: Parameters<SeriesRepository["createSeries"]>[0][] = [];

  const repository: SeriesRepository = {
    async createSeries(data) {
      createdPayloads.push(data);
      const series = createSeries({
        id: `series_${seriesById.size + 1}`,
        title: data.title,
        slug: data.slug,
        description: data.description,
        genre: data.genre,
        ownerId: data.ownerId,
        publicationType: data.publicationType,
        status: "DRAFT"
      });
      seriesById.set(series.id, series);
      return series;
    },
    async findSeriesById(seriesId) {
      return seriesById.get(seriesId) ?? null;
    },
    async findSeriesBySlug(slug) {
      return [...seriesById.values()].find((series) => series.slug === slug) ?? null;
    },
    async listSeriesForUser(userId) {
      return [...seriesById.values()].filter((series) => series.ownerId === userId);
    },
    async updateSeries(seriesId, data) {
      const existing = seriesById.get(seriesId);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: now };
      seriesById.set(seriesId, updated);
      return updated;
    },
    async deleteSeries(seriesId) {
      return seriesById.delete(seriesId);
    },
    async getSeriesMemberRole(seriesId, userId) {
      const series = seriesById.get(seriesId);
      return series?.ownerId === userId ? "OWNER_MANGAKA" : null;
    }
  };

  return { repository, createdPayloads, seriesById };
}

describe("series service", () => {
  it("creates a draft series with normalized slug data", async () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0.123456789);
    const { repository, createdPayloads } = createRepository();
    const service = createSeriesService(repository);

    const series = await service.createSeries({
      title: "Moon Ink!!",
      description: "A clean creation flow.",
      genre: ["Action", "Drama"],
      publicationType: "WEEKLY",
      ownerId: "user_owner"
    });

    expect(createdPayloads[0]).toMatchObject({
      title: "Moon Ink!!",
      slug: "moon-ink-4fzzzx",
      description: "A clean creation flow.",
      genre: ["Action", "Drama"],
      publicationType: "WEEKLY",
      ownerId: "user_owner"
    });
    expect(series).toMatchObject({
      title: "Moon Ink!!",
      slug: "moon-ink-4fzzzx",
      status: "DRAFT"
    });

    random.mockRestore();
  });

  it("rejects blank titles before repository writes", async () => {
    const { repository, createdPayloads } = createRepository();
    const service = createSeriesService(repository);

    await expect(
      service.createSeries({
        title: " ",
        description: "Missing title.",
        ownerId: "user_owner"
      })
    ).rejects.toMatchObject({
      code: "INVALID_TITLE",
      statusCode: 400
    });
    expect(createdPayloads).toHaveLength(0);
  });

  it("allows only the owner to delete draft series", async () => {
    const { repository } = createRepository([createSeries({ id: "series_draft", ownerId: "user_owner" })]);
    const service = createSeriesService(repository);

    await expect(service.deleteSeries("series_draft", "user_other")).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403
    });

    await expect(service.deleteSeries("series_draft", "user_owner")).resolves.toBe(true);
  });

  it("blocks deletion once a series leaves draft", async () => {
    const { repository } = createRepository([
      createSeries({
        id: "series_submitted",
        ownerId: "user_owner",
        status: "SUBMITTED"
      })
    ]);
    const service = createSeriesService(repository);

    await expect(service.deleteSeries("series_submitted", "user_owner")).rejects.toMatchObject({
      code: "INVALID_STATUS",
      statusCode: 400
    });
  });
});
