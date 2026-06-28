import axios from "axios";
import mongoose from "mongoose";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";

async function login(email, password) {
  let pw = password;
  if (email === "editor@mangaflow.local") {
    pw = "editor123";
  }
  const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password: pw });
  return res.data.data.accessToken;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2E() {
  try {
    console.log("=== Starting E2E Setup to leave task in MANGAKA_APPROVED state ===");

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
      title: "Test Series " + Date.now(),
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

    console.log("-> Admin Assigning Editor to Series...");
    await adminClient.post(`/series/${seriesId}/assign-editor`, {
      editorUserId: editorId,
    });

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

    try {
      console.log("-> Adding Editor to SeriesMember...");
      await mangakaClient.post(`/series/${seriesId}/members`, {
        userId: editorId,
        role: "EDITOR",
        accessScope: "FULL",
      });
      console.log("-> Editor added to Production Team.");
    } catch (err: any) {
      if (err.response?.status === 409 || err.message?.includes("already an active member")) {
        console.log("-> Editor is already a member of the series.");
      } else {
        throw err;
      }
    }

    console.log("-> Creating Chapter...");
    const chapterRes = await mangakaClient.post("/chapters", {
      seriesId,
      chapterNumber: 1,
      title: "Chapter 1: The Beginning",
    });
    const chapterId = chapterRes.data.data.id;
    console.log(`-> Chapter Created: ${chapterId}`);

    // console.log("-> Advancing Chapter Status to IN_PRODUCTION...");
    // await mangakaClient.patch(`/chapters/${chapterId}/status`, { status: "IN_PRODUCTION" });

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

    console.log("\n[6] Workflow 3: Finalizing Review (Mangaka Only)...");
    console.log("-> Mangaka approving submission...");
    await mangakaClient.post(`/submissions/${submissionId}/mangaka-approve`, { reviewerNote: "Looks good" });
    
    console.log(`\n\n🎉 SUCCESS! Task is now in MANGAKA_APPROVED state.`);
    console.log(`Task ID: ${taskId}`);
    console.log(`Submission ID: ${submissionId}`);
    console.log(`Series ID: ${seriesId}`);
    console.log(`You can now log in as editor@mangaflow.local / editor@mangaflow.local and review this task!`);

  } catch (error: any) {
    console.error("\n❌ E2E Setup Failed with error:");
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
    process.exitCode = 1;
  }
}

runE2E();
