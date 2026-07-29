import fs from "node:fs";
import path from "node:path";

type ActorKey = "admin" | "mangaka" | "assistant" | "editor" | "board" | "board2" | "board3";

type Actor = {
  email: string;
  token: string;
  user: { id: string; role: string; name?: string };
};

type EvidenceStep = {
  name: string;
  method: string;
  path: string;
  status: number;
  expect?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

const baseUrl = (process.env.P0_AUDIT_BASE_URL ?? "http://localhost:3001").replace(/\/+$/, "");
const runId = `p0-${Date.now()}`;
const reportDir = path.resolve(process.cwd().endsWith("backend") ? ".." : ".", "docs", "reports");
const reportPath = path.join(reportDir, `mangaflow-p0-localhost-audit-${runId}.json`);
const actors: Record<ActorKey, { email: string; password: string }> = {
  admin: { email: "admin@beachread.jp", password: "admin@beachread.jp" },
  mangaka: { email: "inoue@beachread.jp", password: "inoue@beachread.jp" },
  assistant: { email: "jun@beachread.jp", password: "jun@beachread.jp" },
  editor: { email: "tanaka@beachread.jp", password: "tanaka@beachread.jp" },
  board: { email: "board@beachread.jp", password: "board@beachread.jp" },
  board2: { email: "sato@beachread.jp", password: "sato@beachread.jp" },
  board3: { email: "kobayashi@beachread.jp", password: "kobayashi@beachread.jp" },
};

const evidence: EvidenceStep[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function pick(data: any, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, data?.[field]]));
}

async function api<T = any>(
  actor: Actor | null,
  method: string,
  apiPath: string,
  body?: unknown,
  expectedStatus = 200,
  stepName = apiPath,
  extraHeaders: Record<string, string> = {},
) {
  const response = await fetch(`${baseUrl}${apiPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(actor ? { Authorization: `Bearer ${actor.token}` } : {}),
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  evidence.push({
    name: stepName,
    method,
    path: apiPath,
    status: response.status,
    data: json?.data && typeof json.data === "object" ? pick(json.data, ["id", "status", "result", "role"]) : undefined,
  });
  if (response.status !== expectedStatus) {
    throw new Error(
      `${stepName} expected HTTP ${expectedStatus}, got ${response.status}: ${text.slice(0, 1000)}`,
    );
  }
  return json as T;
}

async function login(key: ActorKey): Promise<Actor> {
  const credentials = actors[key];
  const response = await api<{ data: { accessToken: string; user: Actor["user"] } }>(
    null,
    "POST",
    "/api/auth/login",
    credentials,
    200,
    `login:${key}`,
  );
  assert(response.data.accessToken, `Missing token for ${key}`);
  return { email: credentials.email, token: response.data.accessToken, user: response.data.user };
}

async function main() {
  fs.mkdirSync(reportDir, { recursive: true });

  const session = {
    admin: await login("admin"),
    mangaka: await login("mangaka"),
    assistant: await login("assistant"),
    editor: await login("editor"),
    board: await login("board"),
    board2: await login("board2"),
    board3: await login("board3"),
  };

  const proposal = await api<{ data: any }>(
    session.mangaka,
    "POST",
    "/api/proposals",
    {
      title: `P0 Audit Proposal ${runId}`,
      synopsis: "Automated localhost P0 audit proposal.",
      requestedPublicationType: "WEEKLY",
      manuscripts: [{ id: `${runId}-ms-v1`, version: 1, fileUrl: "metadata://p0-audit-v1.pdf" }],
    },
    201,
    "proposal:create",
  );
  const proposalId = proposal.data.id;

  await api(session.mangaka, "POST", `/api/proposals/${proposalId}/actions/SUBMIT`, {}, 200, "proposal:submit");
  await api(session.editor, "POST", `/api/proposals/${proposalId}/actions/CLAIM`, {}, 200, "proposal:claim");
  const changes = await api<{ data: any }>(
    session.editor,
    "POST",
    `/api/proposals/${proposalId}/actions/REQUEST_CHANGES`,
    { comment: "Tighten the first chapter hook." },
    200,
    "proposal:request_changes",
  );
  const requestedChange = changes.data.requestedChanges?.at(-1);
  const resolvedItems = Object.fromEntries(
    (requestedChange?.items ?? []).map((item: any) => [item.id, { resolved: true, response: "Addressed." }]),
  );
  await api(
    session.mangaka,
    "POST",
    `/api/proposals/${proposalId}/actions/RESUBMIT`,
    { resolvedItems, manuscripts: [{ id: `${runId}-ms-v2`, version: 2, fileUrl: "metadata://p0-audit-v2.pdf" }] },
    200,
    "proposal:resubmit",
  );
  await api(session.editor, "POST", `/api/proposals/${proposalId}/actions/FORWARD`, {}, 200, "proposal:forward_board");

  const voting = await api<{ data: any }>(
    session.board,
    "POST",
    "/api/voting-sessions",
    { proposalId },
    201,
    "board:create_voting_session",
  );
  const votingSessionId = voting.data.id;
  assert(voting.data.proposalVersionId === "2", "VotingSession did not freeze proposal version 2.");
  for (const [name, actor] of [
    ["board:vote_chair", session.board],
    ["board:vote_member_2", session.board2],
    ["board:vote_member_3", session.board3],
  ] as const) {
    await api(
      actor,
      "POST",
      `/api/board/series/${proposalId}/votes`,
      { value: "APPROVE", sessionId: votingSessionId },
      200,
      name,
    );
  }
  const finalized = await api<{ data: any }>(
    session.board,
    "POST",
    `/api/voting-sessions/${votingSessionId}/close`,
    {},
    200,
    "board:close_finalize",
  );
  assert(finalized.data.status === "FINALIZED", "VotingSession did not finalize.");
  assert(finalized.data.result === "APPROVED", "VotingSession result is not APPROVED.");

  const seriesList = await api<{ data: any[] }>(
    session.mangaka,
    "GET",
    "/api/series?mine=true",
    undefined,
    200,
    "series:verify_created_from_proposal",
  );
  const productionSeries = seriesList.data.find((series) => series.sourceProposalId === proposalId);
  assert(productionSeries?.status === "PRE_PRODUCTION", "Approved proposal did not create PRE_PRODUCTION series.");
  const productionSeriesId = productionSeries.id;
  await api(
    session.mangaka,
    "POST",
    `/api/series/${productionSeriesId}/actions/START_PRODUCTION`,
    {},
    200,
    "series:start_production",
  );

  const chapter = await api<{ data: any }>(
    session.mangaka,
    "POST",
    `/api/series/${productionSeriesId}/chapters`,
    { number: Math.floor(Date.now() / 1000) % 9000, title: `P0 Audit Chapter ${runId}` },
    201,
    "chapter:create_on_approved_series",
  );
  const chapterId = chapter.data.id;
  await api(session.mangaka, "POST", `/api/chapters/${chapterId}/actions/START_DRAFT`, {}, 200, "chapter:start");
  const page = await api<{ data: any }>(
    session.mangaka,
    "POST",
    `/api/chapters/${chapterId}/pages`,
    {
      pageNumber: 1,
      fileKey: `p0-audit/${runId}/page-1.png`,
      fileName: "page-1.png",
      fileUrl: "metadata://p0-audit/page-1.png",
    },
    201,
    "page:create_uploaded",
  );

  const task = await api<{ data: any }>(
    session.mangaka,
    "POST",
    "/api/studio/tasks",
    {
      seriesId: productionSeriesId,
      chapterId,
      pageId: page.data.id,
      assigneeId: session.assistant.user.id,
      assigneeName: "Suzuki Jun",
      title: `P0 Audit Task ${runId}`,
      isRequired: true,
      quantity: 2,
      rateCode: "SPEECH_BUBBLE",
    },
    201,
    "task:create_required",
  );
  const taskId = task.data.id;

  await api(session.assistant, "POST", `/api/studio/tasks/${taskId}/actions/start`, {}, 200, "task:start");
  const submission = await api<{ data: any }>(
    session.assistant,
    "POST",
    `/api/tasks/${taskId}/submit`,
    {
      expectedCurrentSubmissionId: null,
      fileKey: `p0-audit/${runId}/assistant-submit.png`,
      fileName: "assistant-submit.png",
    },
    201,
    "task:submit",
    { "Idempotency-Key": `${runId}-${taskId}-submit-v1` },
  );
  await api(
    session.mangaka,
    "POST",
    `/api/submissions/${submission.data.id}/approve`,
    { reviewerNote: "Approved for Tantou review." },
    200,
    "submission:mangaka_approve",
  );

  const sendReview = await api<{ data: any }>(
    session.mangaka,
    "POST",
    `/api/studio/chapters/${chapterId}/send-editor-review`,
    {},
    200,
    "chapter:send_tantou_review",
  );
  assert(sendReview.data.chapter?.status === "TANTOU_REVIEW", "Chapter did not enter TANTOU_REVIEW.");
  assert(sendReview.data.chapter?.reviewSnapshot, "Chapter review snapshot was not frozen.");

  const tantouApproved = await api<{ data: any }>(
    session.editor,
    "POST",
    `/api/chapters/${chapterId}/actions/EDITOR_APPROVE`,
    {},
    200,
    "chapter:tantou_approve",
  );
  assert(tantouApproved.data.status === "READY_FOR_PUBLICATION", "Chapter was not ready for publication.");

  const report = {
    runId,
    baseUrl,
    generatedAt: new Date().toISOString(),
    result: "PASS",
    actors: Object.fromEntries(
      Object.entries(session).map(([key, actor]) => [key, { email: actor.email, id: actor.user.id, role: actor.user.role }]),
    ),
    artifacts: {
      proposalId,
      votingSessionId,
      sourceSeriesId: productionSeriesId,
      chapterId,
      pageId: page.data.id,
      taskId,
      submissionId: submission.data.id,
    },
    evidence,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ result: "PASS", reportPath, artifacts: report.artifacts }, null, 2));
}

export const auditCompletion = main().catch((error) => {
  const report = {
    runId,
    baseUrl,
    generatedAt: new Date().toISOString(),
    result: "FAIL",
    error: error instanceof Error ? error.message : String(error),
    evidence,
  };
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify({ result: "FAIL", reportPath, error: report.error }, null, 2));
  process.exitCode = 1;
});
