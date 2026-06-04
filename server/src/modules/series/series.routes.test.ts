import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository, UserStatus } from "../auth/auth.service.js";
import type { Series, SeriesRepository, UpdateSeriesInput } from "./series.service.js";

const now = "2026-06-03T00:00:00.000Z";

function createAuthUser(
  id: string,
  systemRole: SystemRole | null = "MANGAKA",
  status: UserStatus = "ACTIVE"
): AuthUser {
  return {
    id,
    email: `${id}@example.com`,
    fullName: id,
    avatarUrl: null,
    systemRole,
    status,
    createdAt: now,
    updatedAt: now
  };
}

function createSeries(overrides: Partial<Series> = {}): Series {
  return {
    id: overrides.id ?? "series_1",
    title: overrides.title ?? "Moon Ink",
    slug: overrides.slug ?? "moon-ink-abc123",
    description: overrides.description ?? "A manga production flow.",
    genre: overrides.genre ?? ["Drama"],
    coverUrl: overrides.coverUrl ?? null,
    ownerId: overrides.ownerId ?? "owner_id",
    status: overrides.status ?? "DRAFT",
    publicationType: overrides.publicationType ?? "WEEKLY",
    createdAt: now,
    updatedAt: now
  };
}

function createVerifier(id: string, systemRole: SystemRole | null = null, status: UserStatus = "ACTIVE"): AuthVerifier {
  return {
    async verify() {
      return {
        sub: id,
        systemRole,
        status
      };
    },
    async verifyWithProfile() {
      return { sub: id, email: "test@example.com", fullName: id, avatarUrl: null };
    }
  };
}

function createUserRepository(users: AuthUser[]): UserRepository {
  const byId = new Map(users.map((user) => [user.id, user]));

  return {
    async findById(id) {
      return byId.get(id) ?? null;
    },
    async updateOnboarding() {
      throw new Error("not needed in series route tests");
    }
  };
}

function createSeriesRepository(seed: Series[] = []) {
  const seriesById = new Map(seed.map((series) => [series.id, series]));

  const repository: SeriesRepository = {
    async createSeries(data) {
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
    async updateSeries(seriesId, data: UpdateSeriesInput) {
      const existing = seriesById.get(seriesId);
      if (!existing) return null;
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      ) as UpdateSeriesInput;
      const updated = { ...existing, ...cleanData, updatedAt: now };
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

  return { repository, seriesById };
}

describe("series routes", () => {
  it("lets Mangaka create and list their series", async () => {
    const owner = createAuthUser("owner_id");
    const { repository } = createSeriesRepository();
    const app = createApp({
      authVerifier: createVerifier(owner.id, owner.systemRole, owner.status),
      userRepository: createUserRepository([owner]),
      seriesRepository: repository
    });

    const createResponse = await request(app)
      .post("/api/series")
      .set("Authorization", "Bearer valid")
      .send({
        title: "Moon Ink",
        description: "A manga production flow.",
        genre: ["Drama", "Action"],
        publicationType: "WEEKLY"
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      title: "Moon Ink",
      ownerId: owner.id,
      status: "DRAFT",
      genre: ["Drama", "Action"]
    });

    const listResponse = await request(app)
      .get("/api/series")
      .set("Authorization", "Bearer valid");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]).toMatchObject({
      title: "Moon Ink",
      ownerId: owner.id
    });
  });

  it("rejects series creation for users without the Mangaka system role", async () => {
    const assistant = createAuthUser("assistant_id", "ASSISTANT");
    const app = createApp({
      authVerifier: createVerifier(assistant.id, assistant.systemRole, assistant.status),
      userRepository: createUserRepository([assistant]),
      seriesRepository: createSeriesRepository().repository
    });

    const response = await request(app)
      .post("/api/series")
      .set("Authorization", "Bearer valid")
      .send({
        title: "Blocked Series",
        description: "Should not create.",
        genre: [],
        publicationType: null
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      code: "FORBIDDEN"
    });
  });

  it("allows owners to update and delete draft series", async () => {
    const owner = createAuthUser("owner_id");
    const series = createSeries({ id: "series_draft", ownerId: owner.id });
    const { repository, seriesById } = createSeriesRepository([series]);
    const app = createApp({
      authVerifier: createVerifier(owner.id, owner.systemRole, owner.status),
      userRepository: createUserRepository([owner]),
      seriesRepository: repository
    });

    const updateResponse = await request(app)
      .patch(`/api/series/${series.id}`)
      .set("Authorization", "Bearer valid")
      .send({ title: "Moon Ink Revised", genre: ["Mystery"] });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toMatchObject({
      id: series.id,
      title: "Moon Ink Revised",
      genre: ["Mystery"]
    });

    const deleteResponse = await request(app)
      .delete(`/api/series/${series.id}`)
      .set("Authorization", "Bearer valid");

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data).toMatchObject({ success: true });
    expect(seriesById.has(series.id)).toBe(false);
  });

  it("blocks non-members from viewing a series detail", async () => {
    const owner = createAuthUser("owner_id");
    const stranger = createAuthUser("stranger_id");
    const series = createSeries({ id: "series_private", ownerId: owner.id });
    const app = createApp({
      authVerifier: createVerifier(stranger.id, stranger.systemRole, stranger.status),
      userRepository: createUserRepository([owner, stranger]),
      seriesRepository: createSeriesRepository([series]).repository
    });

    const response = await request(app)
      .get(`/api/series/${series.id}`)
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      code: "FORBIDDEN"
    });
  });
});

