import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { Chapter, CreateChapterInput, UpdateChapterInput } from "./chapter.service.js";
import type { ChapterRepository } from "./chapter.repository.js";
import type { Series, SeriesRepository } from "../series/series.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439031";
const ownerId = "507f1f77bcf86cd799439032";
const editorId = "507f1f77bcf86cd799439033";
const assistantId = "507f1f77bcf86cd799439034";

function createAuthUser(clerkId: string, id: string, systemRole: SystemRole): AuthUser {
  return {
    id,
    clerkId,
    email: `${clerkId}@example.com`,
    fullName: clerkId,
    avatarUrl: null,
    systemRole,
    requestedSystemRole: null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

const mangaka = createAuthUser("clerk_mangaka", ownerId, "MANGAKA");
const editor = createAuthUser("clerk_editor", editorId, "EDITOR");
const assistant = createAuthUser("clerk_assistant", assistantId, "ASSISTANT");

function createVerifier(clerkId: string): AuthVerifier {
  return {
    async verify() {
      return {
        clerkId,
        email: `${clerkId}@example.com`,
        fullName: clerkId,
        avatarUrl: null
      };
    }
  };
}

function createUserRepository(users: AuthUser[]): UserRepository {
  const byClerkId = new Map(users.map((user) => [user.clerkId, user]));

  return {
    async findByClerkId(clerkId) {
      return byClerkId.get(clerkId) ?? null;
    },
    async upsertFromClerk(profile) {
      const existing = byClerkId.get(profile.clerkId);
      if (existing) return existing;
      const created = createAuthUser(profile.clerkId, `user_${profile.clerkId}`, "MANGAKA");
      byClerkId.set(profile.clerkId, created);
      return created;
    },
    async updateOnboarding() {
      throw new Error("not needed in chapter route tests");
    }
  };
}

function createSeries(): Series {
  return {
    id: seriesId,
    title: "Moon Ink",
    slug: "moon-ink",
    description: "A chapter test series.",
    genre: ["Drama"],
    coverUrl: null,
    ownerId,
    status: "DRAFT",
    publicationType: "WEEKLY",
    createdAt: now,
    updatedAt: now
  };
}

function createSeriesRepository(roleByUserId: Record<string, string | null>): SeriesRepository {
  const series = createSeries();

  return {
    async createSeries() {
      return series;
    },
    async findSeriesById(inputSeriesId) {
      return inputSeriesId === series.id ? series : null;
    },
    async findSeriesBySlug() {
      return series;
    },
    async listSeriesForUser() {
      return [series];
    },
    async updateSeries() {
      return series;
    },
    async deleteSeries() {
      return false;
    },
    async getSeriesMemberRole(inputSeriesId, userId) {
      if (inputSeriesId !== series.id) return null;
      return roleByUserId[userId] ?? null;
    }
  };
}

function createChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: overrides.id ?? "chapter_1",
    seriesId: overrides.seriesId ?? seriesId,
    title: overrides.title ?? "Chapter One",
    chapterNumber: overrides.chapterNumber ?? 1,
    status: overrides.status ?? "DRAFT",
    deadline: overrides.deadline,
    createdAt: now,
    updatedAt: now
  };
}

function createChapterRepository(seed: Chapter[] = []) {
  const chapters = new Map(seed.map((chapter) => [chapter.id, chapter]));

  const repository: ChapterRepository = {
    async createChapter(data: CreateChapterInput) {
      if ([...chapters.values()].some((chapter) => chapter.seriesId === data.seriesId && chapter.chapterNumber === data.chapterNumber)) {
        throw { code: 11000 };
      }
      const chapter = createChapter({
        id: `chapter_${chapters.size + 1}`,
        seriesId: data.seriesId,
        title: data.title,
        chapterNumber: data.chapterNumber,
        deadline: data.deadline,
        status: "DRAFT"
      });
      chapters.set(chapter.id, chapter);
      return chapter;
    },
    async findChaptersBySeries(inputSeriesId) {
      return [...chapters.values()].filter((chapter) => chapter.seriesId === inputSeriesId);
    },
    async findById(chapterId) {
      return chapters.get(chapterId) ?? null;
    },
    async updateChapter(chapterId, data: UpdateChapterInput) {
      const chapter = chapters.get(chapterId);
      if (!chapter) return null;
      const cleanData = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as UpdateChapterInput;
      const updated = {
        ...chapter,
        ...cleanData,
        deadline: cleanData.deadline === null ? undefined : cleanData.deadline ?? chapter.deadline,
        updatedAt: now
      };
      chapters.set(chapterId, updated);
      return updated;
    },
    async deleteChapter(chapterId) {
      return chapters.delete(chapterId);
    }
  };

  return { repository, chapters };
}

describe("chapter routes", () => {
  it("lets Mangaka owners create, list, update, and delete draft chapters", async () => {
    const { repository, chapters } = createChapterRepository();
    const app = createApp({
      authVerifier: createVerifier(mangaka.clerkId),
      userRepository: createUserRepository([mangaka]),
      seriesRepository: createSeriesRepository({ [ownerId]: "OWNER_MANGAKA" }),
      chapterRepository: repository
    });

    const createResponse = await request(app)
      .post(`/api/series/${seriesId}/chapters`)
      .set("Authorization", "Bearer valid")
      .send({ title: "Chapter One", chapterNumber: 1 });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      seriesId,
      title: "Chapter One",
      chapterNumber: 1,
      status: "DRAFT"
    });

    const listResponse = await request(app)
      .get(`/api/series/${seriesId}/chapters`)
      .set("Authorization", "Bearer valid");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const chapterId = createResponse.body.data.id;
    const updateResponse = await request(app)
      .patch(`/api/chapters/${chapterId}`)
      .set("Authorization", "Bearer valid")
      .send({ title: "Chapter One Revised" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.title).toBe("Chapter One Revised");

    const deleteResponse = await request(app)
      .delete(`/api/chapters/${chapterId}`)
      .set("Authorization", "Bearer valid");

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.deleted).toBe(true);
    expect(chapters.has(chapterId)).toBe(false);
  });

  it("allows Editors to update but not delete chapters", async () => {
    const chapter = createChapter({ id: "chapter_editor" });
    const app = createApp({
      authVerifier: createVerifier(editor.clerkId),
      userRepository: createUserRepository([editor]),
      seriesRepository: createSeriesRepository({ [editorId]: "EDITOR" }),
      chapterRepository: createChapterRepository([chapter]).repository
    });

    const updateResponse = await request(app)
      .patch(`/api/chapters/${chapter.id}`)
      .set("Authorization", "Bearer valid")
      .send({ status: "IN_PROGRESS" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.status).toBe("IN_PROGRESS");

    const deleteResponse = await request(app)
      .delete(`/api/chapters/${chapter.id}`)
      .set("Authorization", "Bearer valid");

    expect(deleteResponse.status).toBe(403);
    expect(deleteResponse.body.code).toBe("FORBIDDEN");
  });

  it("rejects assistants from creating chapters and non-members from listing", async () => {
    const assistantApp = createApp({
      authVerifier: createVerifier(assistant.clerkId),
      userRepository: createUserRepository([assistant]),
      seriesRepository: createSeriesRepository({ [assistantId]: "ASSISTANT" }),
      chapterRepository: createChapterRepository().repository
    });

    const createResponse = await request(assistantApp)
      .post(`/api/series/${seriesId}/chapters`)
      .set("Authorization", "Bearer valid")
      .send({ title: "Blocked", chapterNumber: 1 });

    expect(createResponse.status).toBe(403);

    const stranger = createAuthUser("clerk_stranger", "507f1f77bcf86cd799439035", "MANGAKA");
    const strangerApp = createApp({
      authVerifier: createVerifier(stranger.clerkId),
      userRepository: createUserRepository([stranger]),
      seriesRepository: createSeriesRepository({ [stranger.id]: null }),
      chapterRepository: createChapterRepository([createChapter()]).repository
    });

    const listResponse = await request(strangerApp)
      .get(`/api/series/${seriesId}/chapters`)
      .set("Authorization", "Bearer valid");

    expect(listResponse.status).toBe(403);
    expect(listResponse.body.code).toBe("FORBIDDEN");
  });
});
