import { describe, expect, it } from "vitest";
import { createManuscriptService, type Manuscript } from "./manuscript.service.js";
import type { ManuscriptRepository } from "./manuscript.repository.js";

const now = "2026-06-03T00:00:00.000Z";

function createManuscript(overrides: Partial<Manuscript> = {}): Manuscript {
  return {
    id: overrides.id ?? "manuscript_1",
    seriesId: overrides.seriesId ?? "series_1",
    uploadedBy: overrides.uploadedBy ?? "user_mangaka",
    title: overrides.title ?? "Draft Manuscript",
    description: overrides.description ?? "Initial pages.",
    fileUrls: overrides.fileUrls ?? ["storage://manuscript.pdf"],
    previewUrls: overrides.previewUrls,
    currentVersion: overrides.currentVersion ?? 1,
    status: overrides.status ?? "DRAFT",
    createdAt: now,
    updatedAt: now
  };
}

function createRepository(seed: Manuscript[] = []) {
  const manuscripts = new Map(seed.map((manuscript) => [manuscript.id, manuscript]));
  const createdPayloads: Parameters<ManuscriptRepository["createManuscript"]>[0][] = [];

  const repository: ManuscriptRepository = {
    async createManuscript(data) {
      createdPayloads.push(data);
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
    async findManuscriptsBySeries(seriesId) {
      return [...manuscripts.values()].filter((manuscript) => manuscript.seriesId === seriesId);
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

  return { repository, createdPayloads, manuscripts };
}

describe("manuscript service", () => {
  it("creates a draft manuscript only when files are present", async () => {
    const { repository, createdPayloads } = createRepository();
    const service = createManuscriptService(repository);

    const manuscript = await service.createManuscript(
      {
        seriesId: "series_1",
        title: "Pilot",
        description: "Pilot draft.",
        fileUrls: ["storage://pilot.pdf"]
      },
      "user_mangaka"
    );

    expect(createdPayloads[0]).toMatchObject({
      seriesId: "series_1",
      uploadedBy: "user_mangaka",
      fileUrls: ["storage://pilot.pdf"]
    });
    expect(manuscript).toMatchObject({
      status: "DRAFT",
      currentVersion: 1
    });
  });

  it("rejects manuscript creation without files", async () => {
    const { repository, createdPayloads } = createRepository();
    const service = createManuscriptService(repository);

    await expect(
      service.createManuscript(
        {
          seriesId: "series_1",
          title: "Empty",
          fileUrls: []
        },
        "user_mangaka"
      )
    ).rejects.toMatchObject({
      code: "NO_FILES",
      statusCode: 400
    });
    expect(createdPayloads).toHaveLength(0);
  });

  it("moves manuscripts through submit, editor review, approval, and revision states", async () => {
    const { repository } = createRepository([createManuscript({ id: "manuscript_flow" })]);
    const service = createManuscriptService(repository);

    await expect(service.submitManuscript("manuscript_flow")).resolves.toMatchObject({
      status: "SUBMITTED"
    });
    await expect(service.startEditorReview("manuscript_flow")).resolves.toMatchObject({
      status: "EDITOR_REVIEW"
    });
    await expect(service.requestRevision("manuscript_flow")).resolves.toMatchObject({
      status: "REVISION_REQUESTED"
    });
    await expect(service.submitManuscript("manuscript_flow")).resolves.toMatchObject({
      status: "SUBMITTED"
    });
    await service.startEditorReview("manuscript_flow");
    await expect(service.approveManuscript("manuscript_flow")).resolves.toMatchObject({
      status: "APPROVED"
    });
  });

  it("rejects invalid manuscript state transitions", async () => {
    const { repository } = createRepository([
      createManuscript({
        id: "manuscript_approved",
        status: "APPROVED"
      })
    ]);
    const service = createManuscriptService(repository);

    await expect(service.submitManuscript("manuscript_approved")).rejects.toMatchObject({
      code: "INVALID_STATE",
      statusCode: 400
    });
    await expect(service.startEditorReview("manuscript_approved")).rejects.toMatchObject({
      code: "INVALID_STATE",
      statusCode: 400
    });
  });
});
