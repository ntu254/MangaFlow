import { addMemberSchema, updateMemberSchema } from "../validators/team.schema.js";
import {
  createCommentSchema,
  createRegionSchema,
  createStudioTaskSchema,
  patchCommentSchema,
  patchRegionSchema,
  patchStudioTaskSchema,
} from "../validators/studio.schema.js";
import { CHAPTER_ACTIONS, PAGE_STATUSES, PROPOSAL_ACTIONS } from "../types.js";
import { ChapterModel, NotificationModel, SeriesMemberModel, SeriesModel } from "../db/models.js";

describe("canonical business baseline", () => {
  it("keeps Page lifecycle independent from Chapter review", () => {
    expect(PAGE_STATUSES).toEqual(["PENDING_UPLOAD", "UPLOADED", "FINALIZED"]);
  });

  it("keeps archive only at aggregate lifecycles that retain inactive records", () => {
    expect(CHAPTER_ACTIONS).not.toContain("ARCHIVE");
    expect((ChapterModel.schema.path("status") as any).enumValues).not.toContain("ARCHIVED");
    expect((SeriesModel.schema.path("visibility") as any).enumValues).not.toContain("ARCHIVED");
  });

  it("keeps personal notifications read-only after delivery", () => {
    expect(NotificationModel.schema.path("archivedAt")).toBeUndefined();
  });

  it("does not accept client-owned membership role or status", () => {
    expect(addMemberSchema.safeParse({ userId: "u-1", role: "assistant" }).success).toBe(false);
    expect(addMemberSchema.safeParse({ userId: "u-1", status: "active" }).success).toBe(false);
    expect(updateMemberSchema.safeParse({ role: "editor" }).success).toBe(false);
    expect(updateMemberSchema.safeParse({ status: "inactive" }).success).toBe(false);
  });

  it("does not accept client-owned studio workflow statuses", () => {
    expect(createRegionSchema.safeParse({ seriesId: "s-1", status: "LOCKED" }).success).toBe(false);
    expect(patchRegionSchema.safeParse({ status: "ASSIGNED" }).success).toBe(false);
    expect(createStudioTaskSchema.safeParse({ assigneeId: "u-1", status: "DONE" }).success).toBe(false);
    expect(patchStudioTaskSchema.safeParse({ status: "DONE" }).success).toBe(false);
    expect(createCommentSchema.safeParse({ body: "x", status: "RESOLVED" }).success).toBe(false);
    expect(patchCommentSchema.safeParse({ status: "RESOLVED" }).success).toBe(false);
  });

  it("retires special claim reassignment from the proposal action contract", () => {
    expect(PROPOSAL_ACTIONS).not.toContain(["REASSIGN", "CLAIM"].join("_"));
  });

  it("enforces one active Editor membership per Series at the database boundary", () => {
    const activeTantouIndex = SeriesMemberModel.schema.indexes().find(([fields, options]: [any, any]) =>
      (fields as Record<string, number>).seriesId === 1 &&
      (fields as Record<string, number>).role === 1 &&
      (fields as Record<string, number>).status === 1 &&
      Boolean((options as Record<string, unknown>).unique),
    );

    expect(activeTantouIndex).toBeDefined();
    expect((activeTantouIndex?.[1] as Record<string, unknown>).partialFilterExpression).toEqual({
      role: "editor",
      status: "active",
    });
  });
});
