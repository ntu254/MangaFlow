import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { ChapterModel, StudioTaskModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryServer;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

const CHAPTER_ID = "ch-s-berserk-prod-5";

async function readyChapter() {
  const chapter = (await ChapterModel.findOne({ id: CHAPTER_ID }).lean()) as any;
  await ChapterModel.updateOne(
    { id: CHAPTER_ID },
    {
      $set: {
        status: "IN_PRODUCTION",
        pages: chapter.pages.map((page: any) => ({
          ...page,
          status: "UPLOADED",
          fileKey: "tests/source-page.jpg",
        })),
      },
    },
  );
}

describe("Page assignment lifecycle", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await seedDatabase();
    await readyChapter();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("assigns a page to an assistant and lets that assistant accept it", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p6`;

    const assigned = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);

    expect(assigned.body.data).toMatchObject({
      assistantId: "u-assist",
      assistantName: "Suzuki Jun",
      status: "PENDING",
    });

    const accepted = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/ACCEPT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);

    expect(accepted.body.data).toMatchObject({ status: "ACCEPTED", assistantId: "u-assist" });
    expect(accepted.body.data.acceptedAt).toBeTruthy();
  });

  it("rejects ACCEPT/REJECT from an assistant who is not the assignee", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const otherAssistant = await loginAs("hina@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p7`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);

    const accept = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/ACCEPT`)
      .set("Authorization", `Bearer ${otherAssistant.accessToken}`)
      .send({})
      .expect(403);
    expect(accept.body.code).toBe("PAGE_ASSIGNMENT_NOT_ASSIGNED");

    const reject = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/REJECT`)
      .set("Authorization", `Bearer ${otherAssistant.accessToken}`)
      .send({ reason: "Too busy" })
      .expect(403);
    expect(reject.body.code).toBe("PAGE_ASSIGNMENT_NOT_ASSIGNED");
  });

  it("requires a reason when an assistant rejects a page assignment", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p8`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);

    const rejected = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/REJECT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(400);
    expect(rejected.body.code).toBe("REASON_REQUIRED");
  });

  it("records a rejection reason and marks the page assignment rejected when the assignee rejects", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p9`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);

    const rejected = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/REJECT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ reason: "Overcommitted this week" })
      .expect(200);

    expect(rejected.body.data).toMatchObject({
      status: "REJECTED",
      rejectedReason: "Overcommitted this week",
    });
    expect(rejected.body.data.releasedAt).toBeTruthy();
  });

  it("only allows ACCEPT/REJECT on pending assignments", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p10`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/ACCEPT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);

    const secondAccept = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/ACCEPT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(409);
    expect(secondAccept.body.code).toBe("PAGE_ASSIGNMENT_NOT_PENDING");
  });

  it("blocks reassigning a page whose assignment is still pending or accepted", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();
    const pendingPage = `${CHAPTER_ID}-p11`;
    const acceptedPage = `${CHAPTER_ID}-p12`;

    await request(app)
      .post(`/api/studio/pages/${pendingPage}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);

    const whilePending = await request(app)
      .post(`/api/studio/pages/${pendingPage}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist-2" })
      .expect(409);
    expect(whilePending.body.code).toBe("PAGE_ASSIGNMENT_ACTIVE");

    await request(app)
      .post(`/api/studio/pages/${acceptedPage}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    const assistant = await loginAs("jun@beachread.jp");
    await request(app)
      .post(`/api/studio/pages/${acceptedPage}/assignment/actions/ACCEPT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);

    const whileAccepted = await request(app)
      .post(`/api/studio/pages/${acceptedPage}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist-2" })
      .expect(409);
    expect(whileAccepted.body.code).toBe("PAGE_ASSIGNMENT_ACTIVE");
  });

  it("blocks RELEASE while a non-terminal task exists on the page", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p13`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        chapterId: CHAPTER_ID,
        pageId,
        title: "Active task on page",
        rateCode: "SPEECH_BUBBLE",
      })
      .expect(201);

    const released = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/RELEASE`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(409);
    expect(released.body.code).toBe("PAGE_ASSIGNMENT_HAS_ACTIVE_TASKS");
  });

  it("only lets the owning Mangaka release a page assignment", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p14`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);

    const byAssistant = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/RELEASE`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(403);
    expect(byAssistant.body.code).toBe("FORBIDDEN");
  });

  it("releases a page with no open tasks and allows reassigning to another assistant", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p15`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);

    const released = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/RELEASE`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(200);
    expect(released.body.data).toMatchObject({ status: "RELEASED" });

    const reassigned = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    expect(reassigned.body.data).toMatchObject({ assistantId: "u-assist", status: "PENDING" });
    expect(reassigned.body.data.assignedAt).not.toBe(released.body.data.assignedAt);
  });

  it("creates tasks with assignmentStatus ACCEPTED once the assistant accepts the page", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p16`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/ACCEPT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);

    const created = await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        chapterId: CHAPTER_ID,
        pageId,
        title: "Accepted-assignment task",
        rateCode: "SPEECH_BUBBLE",
      })
      .expect(201);

    expect(created.body.data).toMatchObject({ assigneeId: "u-assist", assignmentStatus: "ACCEPTED" });
  });

  it("mirrors ACCEPT/REJECT onto open tasks of the page", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p17`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        chapterId: CHAPTER_ID,
        pageId,
        title: "Task before acceptance",
        rateCode: "SPEECH_BUBBLE",
      })
      .expect(201);

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/ACCEPT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);

    const afterAccept = (await StudioTaskModel.findOne({ pageId, title: "Task before acceptance" }).lean()) as any;
    expect(afterAccept.assignmentStatus).toBe("ACCEPTED");
  });

  it("mirrors REJECT onto open tasks of the page with the rejection reason", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();
    const pageId = `${CHAPTER_ID}-p18`;

    await request(app)
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        chapterId: CHAPTER_ID,
        pageId,
        title: "Task before rejection",
        rateCode: "SPEECH_BUBBLE",
      })
      .expect(201);

    const rejectRes = await request(app)
      .post(`/api/studio/pages/${pageId}/assignment/actions/REJECT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ reason: "Overcommitted" })
      .expect(200);
    expect(rejectRes.body.data.status).toBe("REJECTED");
    expect(rejectRes.body.data.rejectedReason).toBe("Overcommitted");

    const afterReject = (await StudioTaskModel.findOne({ pageId, title: "Task before rejection" }).lean()) as any;
    expect(afterReject.assignmentStatus).toBe("REJECTED");
    expect(afterReject.assignmentRejectedReason).toBe("Overcommitted");
  });
});
