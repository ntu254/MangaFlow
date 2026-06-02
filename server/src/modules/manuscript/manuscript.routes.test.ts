import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository, UserStatus } from "../auth/auth.service.js";
import type { CreateFileAssetInput, FileAsset } from "../file/file.types.js";
import type { FileRepository } from "../file/file.repository.js";
import type { Manuscript } from "./manuscript.service.js";
import type { ManuscriptRepository } from "./manuscript.repository.js";
import type { Series, SeriesRepository, UpdateSeriesInput } from "../series/series.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439021";
const ownerId = "507f1f77bcf86cd799439022";
const editorId = "507f1f77bcf86cd799439023";
const assistantId = "507f1f77bcf86cd799439024";
const uploadRoot = path.join(process.cwd(), "uploads", "series", seriesId);

afterEach(() => {
  fs.rmSync(uploadRoot, { recursive: true, force: true });
});

function createAuthUser(
  clerkId: string,
  id: string,
  systemRole: SystemRole,
  status: UserStatus = "ACTIVE"
): AuthUser {
  return {
    id,
    clerkId,
    email: `${clerkId}@example.com`,
    fullName: clerkId,
    avatarUrl: null,
    systemRole,
    requestedSystemRole: null,
    status,
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
      throw new Error("not needed in manuscript route tests");
    }
  };
}

function createSeries(overrides: Partial<Series> = {}): Series {
  return {
    id: seriesId,
    title: "Moon Ink",
    slug: "moon-ink",
    description: "Series with manuscripts.",
    genre: ["Drama"],
    coverUrl: null,
    ownerId,
    status: "DRAFT",
    publicationType: "WEEKLY",
    createdAt: now,
    updatedAt: now,
    ...overrides
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
    async updateSeries(_seriesId: string, data: UpdateSeriesInput) {
      return { ...series, ...data, updatedAt: now };
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

function createManuscript(overrides: Partial<Manuscript> = {}): Manuscript {
  return {
    id: overrides.id ?? "manuscript_1",
    seriesId: overrides.seriesId ?? seriesId,
    uploadedBy: overrides.uploadedBy ?? ownerId,
    title: overrides.title ?? "Pilot manuscript",
    description: overrides.description ?? "Initial draft.",
    fileUrls: overrides.fileUrls ?? [`http://localhost:5000/uploads/series/${seriesId}/manuscripts/v1/pilot.pdf`],
    previewUrls: overrides.previewUrls,
    currentVersion: overrides.currentVersion ?? 1,
    status: overrides.status ?? "DRAFT",
    createdAt: now,
    updatedAt: now
  };
}

function createManuscriptRepository(seed: Manuscript[] = []) {
  const manuscripts = new Map(seed.map((manuscript) => [manuscript.id, manuscript]));

  const repository: ManuscriptRepository = {
    async createManuscript(data) {
      const manuscript = createManuscript({
        id: `manuscript_${manuscripts.size + 1}`,
        seriesId: data.seriesId,
        uploadedBy: data.uploadedBy,
        title: data.title,
        description: data.description,
        fileUrls: data.fileUrls,
        status: "DRAFT",
        currentVersion: 1
      });
      manuscripts.set(manuscript.id, manuscript);
      return manuscript;
    },
    async findManuscriptsBySeries(inputSeriesId) {
      return [...manuscripts.values()].filter((manuscript) => manuscript.seriesId === inputSeriesId);
    },
    async findById(manuscriptId) {
      return manuscripts.get(manuscriptId) ?? null;
    },
    async updateStatus(manuscriptId, status) {
      const manuscript = manuscripts.get(manuscriptId);
      if (!manuscript) return null;
      const updated = { ...manuscript, status, updatedAt: now };
      manuscripts.set(manuscriptId, updated);
      return updated;
    }
  };

  return { repository, manuscripts };
}

function createFileRepository() {
  const assets: FileAsset[] = [];

  const repository: FileRepository = {
    async createFileAsset(data: CreateFileAssetInput) {
      const asset: FileAsset = {
        id: `file_${assets.length + 1}`,
        ownerType: data.ownerType,
        ownerId: data.ownerId,
        originalUrl: data.originalUrl,
        aiProcessUrl: data.aiProcessUrl,
        previewUrl: data.previewUrl,
        thumbnailUrl: data.thumbnailUrl,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        versionNumber: data.versionNumber ?? 1,
        uploadedBy: data.uploadedBy,
        createdAt: now,
        updatedAt: now
      };
      assets.push(asset);
      return asset;
    },
    async findById(fileId) {
      return assets.find((asset) => asset.id === fileId) ?? null;
    },
    async findByOwner(ownerType, ownerId) {
      return assets.filter((asset) => asset.ownerType === ownerType && asset.ownerId === ownerId);
    },
    async findLatestByOwner(ownerType, ownerId) {
      return assets.find((asset) => asset.ownerType === ownerType && asset.ownerId === ownerId) ?? null;
    },
    async deleteFileAsset(fileId) {
      const index = assets.findIndex((asset) => asset.id === fileId);
      if (index === -1) return false;
      assets.splice(index, 1);
      return true;
    }
  };

  return { repository, assets };
}

describe("manuscript routes", () => {
  it("lets Mangaka upload manuscripts, creates FileAsset metadata, and lists them", async () => {
    const manuscriptRepository = createManuscriptRepository();
    const fileRepository = createFileRepository();
    const app = createApp({
      authVerifier: createVerifier(mangaka.clerkId),
      userRepository: createUserRepository([mangaka]),
      seriesRepository: createSeriesRepository({ [ownerId]: "OWNER_MANGAKA" }),
      manuscriptRepository: manuscriptRepository.repository,
      fileRepository: fileRepository.repository
    });

    const uploadResponse = await request(app)
      .post(`/api/series/${seriesId}/manuscripts`)
      .set("Authorization", "Bearer valid")
      .field("title", "Pilot manuscript")
      .field("description", "Initial draft.")
      .attach("files", Buffer.from("%PDF-1.4\n"), {
        filename: "pilot.pdf",
        contentType: "application/pdf"
      });

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body.data).toMatchObject({
      title: "Pilot manuscript",
      seriesId,
      uploadedBy: ownerId,
      status: "DRAFT",
      currentVersion: 1
    });
    expect(uploadResponse.body.data.fileUrls[0]).toContain(`/uploads/series/${seriesId}/manuscripts/v1/`);

    expect(fileRepository.assets).toHaveLength(1);
    expect(fileRepository.assets[0]).toMatchObject({
      ownerType: "MANUSCRIPT",
      ownerId: uploadResponse.body.data.id,
      fileName: "pilot.pdf",
      mimeType: "application/pdf",
      uploadedBy: ownerId,
      versionNumber: 1
    });

    const listResponse = await request(app)
      .get(`/api/series/${seriesId}/manuscripts`)
      .set("Authorization", "Bearer valid");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(fs.existsSync(uploadRoot)).toBe(true);
  });

  it("lets Mangaka submit and Editor review manuscripts through allowed states", async () => {
    const manuscript = createManuscript({ id: "manuscript_flow" });
    const manuscriptRepository = createManuscriptRepository([manuscript]);
    const sharedDependencies = {
      userRepository: createUserRepository([mangaka, editor]),
      seriesRepository: createSeriesRepository({
        [ownerId]: "OWNER_MANGAKA",
        [editorId]: "EDITOR"
      }),
      manuscriptRepository: manuscriptRepository.repository
    };

    const mangakaApp = createApp({
      authVerifier: createVerifier(mangaka.clerkId),
      ...sharedDependencies
    });
    const submitResponse = await request(mangakaApp)
      .patch(`/api/series/${seriesId}/manuscripts/${manuscript.id}/submit`)
      .set("Authorization", "Bearer valid");

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.data.status).toBe("SUBMITTED");

    const editorApp = createApp({
      authVerifier: createVerifier(editor.clerkId),
      ...sharedDependencies
    });
    const startResponse = await request(editorApp)
      .patch(`/api/series/${seriesId}/manuscripts/${manuscript.id}/review`)
      .set("Authorization", "Bearer valid")
      .send({ action: "start" });

    expect(startResponse.status).toBe(200);
    expect(startResponse.body.data.status).toBe("EDITOR_REVIEW");

    const approveResponse = await request(editorApp)
      .patch(`/api/series/${seriesId}/manuscripts/${manuscript.id}/review`)
      .set("Authorization", "Bearer valid")
      .send({ action: "approve" });

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.data.status).toBe("APPROVED");
  });

  it("rejects wrong system role and wrong series role for protected manuscript actions", async () => {
    const assistantApp = createApp({
      authVerifier: createVerifier(assistant.clerkId),
      userRepository: createUserRepository([assistant]),
      seriesRepository: createSeriesRepository({ [assistantId]: "ASSISTANT" }),
      manuscriptRepository: createManuscriptRepository().repository,
      fileRepository: createFileRepository().repository
    });

    const uploadResponse = await request(assistantApp)
      .post(`/api/series/${seriesId}/manuscripts`)
      .set("Authorization", "Bearer valid")
      .attach("files", Buffer.from("%PDF-1.4\n"), {
        filename: "blocked.pdf",
        contentType: "application/pdf"
      });

    expect(uploadResponse.status).toBe(403);
    expect(uploadResponse.body).toMatchObject({
      success: false,
      code: "FORBIDDEN"
    });

    const editorWithoutMembershipApp = createApp({
      authVerifier: createVerifier(editor.clerkId),
      userRepository: createUserRepository([editor]),
      seriesRepository: createSeriesRepository({ [editorId]: null }),
      manuscriptRepository: createManuscriptRepository([createManuscript({ id: "manuscript_private", status: "SUBMITTED" })]).repository
    });

    const reviewResponse = await request(editorWithoutMembershipApp)
      .patch(`/api/series/${seriesId}/manuscripts/manuscript_private/review`)
      .set("Authorization", "Bearer valid")
      .send({ action: "start" });

    expect(reviewResponse.status).toBe(403);
    expect(reviewResponse.body).toMatchObject({
      success: false,
      code: "FORBIDDEN"
    });
  });
});
