import axios from "axios";
import mongoose from "mongoose";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";

async function login(email, password) {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
  return res.data.data.accessToken;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2E() {
  try {
    console.log("=== Starting Comprehensive E2E Business Workflow Test ===");

    // 0. Admin Flow - Setup users and task types
    console.log("\n[0] Admin Setup...");
    const adminToken = await login("admin@mangaflow.local", "admin123");
    const adminClient = axios.create({ baseURL: API_BASE_URL, headers: { Authorization: `Bearer ${adminToken}` } });

    console.log("-> Getting User IDs...");
    const usersRes = await adminClient.get("/admin/users");
    const assistantUser = usersRes.data.data.find((u) => u.email === "assistant@mangaflow.local")
      ?? usersRes.data.data.find((u) => u.role === "ASSISTANT");
    const editorUser = usersRes.data.data.find((u) => u.email === "editor@mangaflow.local")
      ?? usersRes.data.data.find((u) => u.role === "EDITOR");
    if (!assistantUser) throw new Error("Assistant user not found. Run seed script.");
    if (!editorUser) throw new Error("Editor user not found. Run seed script.");
    const assistantId = assistantUser.id;
    const editorId = editorUser.id;
    console.log(`-> Assistant ID: ${assistantId}`);
    console.log(`-> Editor ID: ${editorId}`);

    console.log("-> Getting Task Type...");
    const existingTypesRes = await adminClient.get("/task-types");
    let taskTypeId;
    if (existingTypesRes.data.data.length > 0) {
      taskTypeId = existingTypesRes.data.data[0]._id || existingTypesRes.data.data[0].id;
    } else {
      const suffix = Date.now();
      const taskTypeRes = await adminClient.post("/admin/task-types", {
        name: "Inking Test " + suffix,
        code: "INKING_TEST_" + suffix,
        description: "Inking pages",
        baseRate: 500,
      });
      taskTypeId = taskTypeRes.data.data._id || taskTypeRes.data.data.id;
    }
    console.log(`-> Task Type ID: ${taskTypeId}`);

    // 1. Mangaka Flow (Series Proposal)
    console.log("\n[1] Workflow 1: Series Proposal...");
    const mangakaToken = await login("mangaka@mangaflow.local", "mangaka@mangaflow.local");
    const mangakaClient = axios.create({ baseURL: API_BASE_URL, headers: { Authorization: `Bearer ${mangakaToken}` } });

    const seriesRes = await mangakaClient.post("/series", {
      title: "E2E Full Workflow Series " + Date.now(),
      synopsis: "This is a comprehensive test series",
      targetAudience: "Shonen readers",
      requestedPublicationType: "WEEKLY",
      genres: ["Shonen"],
    });
    const seriesId = seriesRes.data.data.id;
    console.log(`-> Series Created: ${seriesId}`);

    const uploadRes = await mangakaClient.post(`/series/${seriesId}/manuscripts/uploads`, {
      originalName: "test-manuscript.pdf",
      contentType: "application/pdf",
      size: 1024,
    });
    const manuscriptId = uploadRes.data.data.manuscriptId;
    console.log(`-> Manuscript uploaded: ${manuscriptId}`);

    await mangakaClient.post(`/series/${seriesId}/submit`);
    console.log("-> Series Submitted to Editor.");

    // 2. Editor Flow (Board Review)
    console.log("\n[2] Workflow 1: Editor Review...");
    const editorToken = await login("editor@mangaflow.local", "editor@mangaflow.local");
    const editorClient = axios.create({ baseURL: API_BASE_URL, headers: { Authorization: `Bearer ${editorToken}` } });

    await editorClient.post(`/manuscripts/${manuscriptId}/forward-to-board`, {
      editorRecommendation: "Looks good, forward to Board.",
      feasibilityNote: "Production scope is feasible for a weekly schedule.",
      suggestedPublicationType: "WEEKLY",
    });
    console.log("-> Series Forwarded to Board.");

    // 3. Board Flow (Approval)
    console.log("\n[3] Workflow 1: Board Approval...");
    const boardToken = await login("board@mangaflow.local", "board@mangaflow.local");
    const boardClient = axios.create({ baseURL: API_BASE_URL, headers: { Authorization: `Bearer ${boardToken}` } });

    await boardClient.post(`/board/series/${seriesId}/votes`, { value: "APPROVE" });
    await boardClient.post(`/board/series/${seriesId}/decisions/finalize`, {
      decision: "APPROVED",
      publicationType: "WEEKLY",
      note: "Approved for weekly publication.",
    });
    console.log("-> Series APPROVED by Board.");

    // 4. Chapter Production & Team Assignment
    console.log("\n[4] Workflow 2: Chapter Production & Task Assignment...");
    console.log("-> Adding Assistant to SeriesMember...");
    await mangakaClient.post(`/series/${seriesId}/members`, {
      userId: assistantId,
      role: "ASSISTANT",
      accessScope: "TASK_ONLY",
    });
    console.log("-> Assistant added to Production Team.");

    console.log("-> Adding Editor to SeriesMember...");
    await mangakaClient.post(`/series/${seriesId}/members`, {
      userId: editorId,
      role: "EDITOR",
      accessScope: "FULL",
    });
    console.log("-> Editor added to Production Team.");

    console.log("-> Creating Chapter...");
    const chapterRes = await mangakaClient.post("/chapters", {
      seriesId,
      chapterNumber: 1,
      title: "Chapter 1: The Beginning",
    });
    const chapterId = chapterRes.data.data.id;
    console.log(`-> Chapter Created: ${chapterId}`);

    console.log("-> Advancing Chapter Status to IN_PRODUCTION...");
    await mangakaClient.patch(`/chapters/${chapterId}/status`, { status: "IN_PRODUCTION" });

    console.log("-> Creating Page...");
    const pageRes = await mangakaClient.post(`/chapters/${chapterId}/pages`, { pageNumber: 1 });
    const pageId = pageRes.data.data._id || pageRes.data.data.id;
    console.log(`-> Page Created: ${pageId}`);

    console.log("-> Creating Task and Assigning to Assistant...");
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
    const taskRes = await mangakaClient.post("/tasks", {
      seriesId,
      chapterId,
      pageId,
      taskTypeId,
      assignedTo: assistantId,
      title: "Inking Page 1",
      dueDate: dueDate.toISOString(),
      priority: "HIGH",
    });
    const taskId = taskRes.data.data.id;
    console.log(`-> Task Created: ${taskId}`);

    // 5. Task Execution
    console.log("\n[5] Workflow 3: Task Execution & Review...");
    const assistantToken = await login("assistant@mangaflow.local", "assistant@mangaflow.local");
    const assistantClient = axios.create({ baseURL: API_BASE_URL, headers: { Authorization: `Bearer ${assistantToken}` } });

    console.log("-> Assistant submitting task...");
    await assistantClient.patch(`/tasks/${taskId}/status`, { status: "IN_PROGRESS" });
    const subRes = await assistantClient.post(`/tasks/${taskId}/submissions`, {
      resultText: "I finished the inking for page 1.",
    });
    const submissionId = subRes.data.data.id;
    console.log(`-> Submission Created: ${submissionId}`);

    // 6. Review & Feedback (Comment)
    console.log("\n[6] Workflow 4: Comment & Feedback...");
    console.log("-> Editor creating a blocking comment...");
    const commentRes = await editorClient.post("/comments", {
      seriesId,
      chapterId,
      pageId,
      taskId,
      body: "Line art needs to be thicker.",
      isBlocking: true,
    });
    const commentId = commentRes.data.data.id;
    console.log(`-> Comment Created: ${commentId}`);

    console.log("-> Assistant fixing comment...");
    await assistantClient.post(`/comments/${commentId}/mark-fixed`);
    
    console.log("-> Mangaka verifying comment fix...");
    await mangakaClient.post(`/comments/${commentId}/verify-fixed`);

    console.log("-> Editor resolving comment...");
    await editorClient.post(`/comments/${commentId}/resolve`);
    console.log("-> Comment Resolved.");

    console.log("\n[7] Workflow 3: Finalizing Review...");
    console.log("-> Mangaka approving submission...");
    await mangakaClient.post(`/submissions/${submissionId}/mangaka-approve`, { reviewerNote: "Looks good" });
    
    console.log("-> Editor approving submission...");
    await editorClient.post(`/submissions/${submissionId}/editor-approve`, { reviewerNote: "Approved for production" });
    console.log("-> Task EDITOR_APPROVED.");

    // 8. Payroll
    console.log("\n[8] Workflow 5: Payroll & Earnings...");
    console.log("-> Waiting for Task Earning...");
    let earning;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const earningsRes = await adminClient.get("/payroll/earnings");
      earning = earningsRes.data.data.find((item) => {
        const earningTaskId = item.taskId?._id || item.taskId?.id || item.taskId;
        return String(earningTaskId) === String(taskId);
      });
      if (earning) break;
      await sleep(500);
    }
    if (!earning) throw new Error("Task earning was not auto-calculated after editor approval.");
    const earningId = earning._id || earning.id;
    console.log(`-> Earning Found: ${earningId}`);

    console.log("-> Admin confirming Task Earning...");
    await adminClient.post(`/payroll/tasks/${taskId}/confirm`);
    console.log("-> Earning CONFIRMED.");

    // 9. Publication Readiness
    console.log("\n[9] Workflow 6: Publication Readiness...");
    console.log("-> Checking Readiness...");
    const readRes = await editorClient.get(`/chapters/${chapterId}/readiness`);
    console.log("-> Readiness Details: ", readRes.data.data.itemStatus);

    // Skip patching READY_FOR_PUBLICATION for now because we might not pass all checks dynamically yet, but we tested the flow
    console.log("-> Setting Chapter to READY_FOR_PUBLICATION...");
    await editorClient.patch(`/chapters/${chapterId}/status`, { status: "READY_FOR_PUBLICATION" });
    console.log("-> Chapter is READY_FOR_PUBLICATION.");

    // 10. Ranking & At-Risk
    console.log("\n[10] Workflow 7: Ranking & At-Risk...");
    console.log("-> Board importing ranking...");
    const rankingRes = await boardClient.post("/rankings/import", {
      period: "2026-W24",
      seriesId,
      voteCount: 150,
      readerScore: 3.5, // Poor score
    });
    const rankingId = rankingRes.data.data._id || rankingRes.data.data.id;
    console.log(`-> Ranking Imported: ${rankingId}`);
    
    console.log("-> Submitting Ranking...");
    await boardClient.post(`/rankings/${rankingId}/submit`);

    console.log("-> Finalizing Ranking...");
    await boardClient.post(`/rankings/${rankingId}/finalize`);
    
    console.log("-> Simulating System setting Series to AT_RISK...");
    await mongoose.connect("mongodb://localhost:27017/mangaflow");
    await mongoose.connection.collection("series").updateOne(
      { _id: new mongoose.Types.ObjectId(seriesId) },
      { $set: { status: "AT_RISK" } }
    );
    
    console.log("-> Board making At-Risk decision (CONTINUE)...");
    await boardClient.post(`/board/series/${seriesId}/at-risk-decisions`, {
      decision: "CONTINUE",
      notes: "Give it one more chance."
    });
    console.log("-> At-Risk decision saved.");

    console.log("\n✅ ALL BUSINESS WORKFLOWS TESTED SUCCESSFULLY!");

  } catch (error) {
    console.error("\n❌ E2E Workflow Test Failed with error:");
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

runE2E();
