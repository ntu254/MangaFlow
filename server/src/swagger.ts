import fs from "fs"
import path from "path"
import swaggerAutogen from "swagger-autogen"

type HttpMethod = "get" | "post" | "put" | "patch" | "delete"
type OpenApiDoc = {
  openapi: string
  info: Record<string, unknown>
  servers?: Array<Record<string, unknown>>
  tags?: Array<{ name: string; description?: string }>
  paths: Record<string, Record<string, any>>
  components?: Record<string, any>
}

const outputFile = "./swagger-output.json"
const endpointsFiles = ["./src/index.ts"]

const tags = [
  { name: "Health", description: "Runtime health checks" },
  { name: "Auth", description: "JWT authentication, refresh tokens, and current-user lookup" },
  { name: "Admin", description: "Admin-only user, board-member, and workflow configuration APIs" },
  { name: "Dashboard", description: "Role dashboard summaries and sidebar counts" },
  { name: "Series", description: "Series proposals, summaries, manuscripts, and production team membership" },
  { name: "Manuscripts", description: "Editor proposal review actions before Board review" },
  { name: "Board", description: "Board queue, voting, tie-break, and at-risk decisions" },
  { name: "Chapters", description: "Chapter lifecycle, pages, and publication readiness" },
  { name: "Files", description: "Private R2 file assets and signed upload/download URLs" },
  { name: "AI", description: "AI-assisted manga bubble detection and processing" },
  { name: "Regions", description: "Page region creation and lifecycle" },
  { name: "Tasks", description: "Task assignment, task workspace access, and task metadata" },
  { name: "Task Types", description: "Task type catalog for assignment and payroll base rates" },
  { name: "Submissions", description: "Assistant submissions and Mangaka/Editor review chain" },
  { name: "Comments", description: "Production comment lifecycle and resolution" },
  { name: "Payroll", description: "Assistant earning calculation, confirmation, and payout tracking" },
  { name: "Publications", description: "Publication creation, scheduling, and publish action" },
  { name: "Rankings", description: "Ranking import, finalization, and Mangaka ranking views" },
]

const doc = {
  info: {
    version: "1.0.0",
    title: "MangaFlow API",
    description:
      "MangaFlow internal production workflow API. Response envelope is `{ success, message, data }`; errors use `{ success, message, errors? }`.",
  },
  host: "localhost:3001",
  basePath: "/",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  tags,
  securityDefinitions: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
}

const schemas = {
  ApiSuccess: {
    type: "object",
    required: ["success"],
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string", example: "Operation successful" },
      data: { nullable: true },
    },
  },
  ApiError: {
    type: "object",
    required: ["success", "message"],
    properties: {
      success: { type: "boolean", example: false },
      message: { type: "string", example: "Validation failed" },
      errors: { type: "array", items: { type: "object" } },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: { email: { type: "string", format: "email" }, password: { type: "string", format: "password" } },
  },
  RefreshTokenRequest: {
    type: "object",
    required: ["refreshToken"],
    properties: { refreshToken: { type: "string" } },
  },
  CreateUserRequest: {
    type: "object",
    required: ["email", "password", "name", "role"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
      name: { type: "string" },
      displayName: { type: "string", maxLength: 100 },
      team: { type: "string", maxLength: 100 },
      notes: { type: "string", maxLength: 1000 },
      role: { type: "string", enum: ["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"] },
      isActive: { type: "boolean", default: true },
    },
  },
  CreateSeriesRequest: {
    type: "object",
    required: ["title", "synopsis"],
    properties: { title: { type: "string" }, synopsis: { type: "string" }, genres: { type: "array", items: { type: "string" } } },
  },
  ManuscriptUploadRequest: {
    type: "object",
    required: ["originalName", "contentType", "size"],
    properties: {
      originalName: { type: "string" },
      contentType: { type: "string", enum: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
      size: { type: "integer", minimum: 1 },
      expiresIn: { type: "integer", minimum: 1 },
    },
  },
  BoardVoteRequest: { type: "object", required: ["value"], properties: { value: { type: "string", enum: ["APPROVE", "REJECT", "NEEDS_REVISION"] } } },
  AtRiskDecisionRequest: {
    type: "object",
    required: ["decision"],
    properties: { decision: { type: "string", enum: ["CONTINUE", "WARNING", "REQUEST_IMPROVEMENT_PLAN", "CANCEL"] }, note: { type: "string" } },
  },
  ReviewNoteRequest: { type: "object", properties: { reviewNote: { type: "string", maxLength: 2000 } } },
  CreateChapterRequest: { type: "object", required: ["seriesId", "chapterNumber", "title"], properties: { seriesId: { type: "string" }, chapterNumber: { type: "integer" }, title: { type: "string" } } },
  UpdateChapterStatusRequest: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["DRAFT", "IN_PRODUCTION", "IN_REVIEW", "REVISION_REQUIRED", "READY_FOR_PUBLICATION", "PUBLISHED"] } } },
  CreatePageRequest: { type: "object", required: ["pageNumber"], properties: { pageNumber: { type: "integer", minimum: 1 } } },
  PresignedUploadRequest: {
    type: "object",
    required: ["originalName", "contentType"],
    properties: { originalName: { type: "string" }, contentType: { type: "string", enum: ["image/jpeg", "image/png", "image/webp", "application/pdf"] }, expiresIn: { type: "integer", minimum: 1 } },
  },
  ConfirmPageUploadRequest: {
    type: "object",
    required: ["fileAssetId", "r2Key", "originalName", "mimeType", "size"],
    properties: { fileAssetId: { type: "string" }, r2Key: { type: "string" }, originalName: { type: "string" }, mimeType: { type: "string" }, size: { type: "integer", minimum: 1 } },
  },
  CreateRegionRequest: {
    type: "object",
    required: ["regionIndex", "bbox"],
    properties: { regionIndex: { type: "integer", minimum: 0 }, bbox: { type: "object", required: ["x", "y", "width", "height"], properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number", minimum: 1 }, height: { type: "number", minimum: 1 } } } },
  },
  UpdateRegionStatusRequest: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ACTIVE", "ARCHIVED"] } } },
  CreateTaskRequest: {
    type: "object",
    required: ["seriesId", "chapterId", "taskTypeId", "assignedTo", "title", "dueDate"],
    properties: { seriesId: { type: "string" }, chapterId: { type: "string" }, pageId: { type: "string" }, regionId: { type: "string" }, taskTypeId: { type: "string" }, assignedTo: { type: "string" }, title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["LOW", "NORMAL", "HIGH", "URGENT"] }, dueDate: { type: "string", format: "date-time" }, contextPageIds: { type: "array", items: { type: "string" } } },
  },
  UpdateTaskStatusRequest: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["TODO", "IN_PROGRESS", "SUBMITTED", "MANGAKA_APPROVED", "EDITOR_APPROVED", "REVISION_REQUESTED", "REJECTED"] } } },
  UpdateTaskPriorityRequest: { type: "object", required: ["priority"], properties: { priority: { type: "string", enum: ["LOW", "NORMAL", "HIGH", "URGENT"] } } },
  UpdateTaskDueDateRequest: { type: "object", required: ["dueDate"], properties: { dueDate: { type: "string", format: "date-time" } } },
  CreateSubmissionRequest: { type: "object", required: ["content"], properties: { content: { type: "string" }, fileAssetIds: { type: "array", items: { type: "string" } } } },
  ReviewActionRequest: { type: "object", properties: { reviewNote: { type: "string", maxLength: 2000 } } },
  CreateCommentRequest: { type: "object", required: ["taskId", "body"], properties: { taskId: { type: "string" }, pageId: { type: "string" }, regionId: { type: "string" }, body: { type: "string" } } },
  CreatePublicationRequest: { type: "object", required: ["chapterId"], properties: { chapterId: { type: "string" }, scheduledAt: { type: "string", format: "date-time" } } },
  SchedulePublicationRequest: { type: "object", required: ["scheduledAt"], properties: { scheduledAt: { type: "string", format: "date-time" } } },
  ImportRankingRequest: { type: "object", required: ["period", "entries"], properties: { period: { type: "string" }, entries: { type: "array", items: { type: "object", properties: { seriesId: { type: "string" }, voteCount: { type: "integer" }, readerScore: { type: "number", minimum: 1, maximum: 10 } } } } } },
}

const requestSchemaByPattern: Array<[RegExp, keyof typeof schemas]> = [
  [/\/api\/auth\/login$/, "LoginRequest"],
  [/\/api\/auth\/refresh-token$/, "RefreshTokenRequest"],
  [/\/api\/(auth\/)?admin\/users$/, "CreateUserRequest"],
  [/\/api\/series\/?$/, "CreateSeriesRequest"],
  [/\/api\/series\/\{seriesId\}\/manuscripts\/uploads$/, "ManuscriptUploadRequest"],
  [/\/api\/board\/series\/\{seriesId\}\/votes$/, "BoardVoteRequest"],
  [/\/api\/board\/series\/\{seriesId\}\/decisions\/tie-break$/, "BoardVoteRequest"],
  [/\/api\/board\/series\/\{seriesId\}\/at-risk-decisions$/, "AtRiskDecisionRequest"],
  [/\/api\/manuscripts\/\{manuscriptId\}\/(request-revision|forward-to-board|reject)$/, "ReviewNoteRequest"],
  [/\/api\/chapters\/?$/, "CreateChapterRequest"],
  [/\/api\/chapters\/\{chapterId\}\/status$/, "UpdateChapterStatusRequest"],
  [/\/api\/chapters\/\{chapterId\}\/pages$/, "CreatePageRequest"],
  [/\/api\/files\/presigned-upload$/, "PresignedUploadRequest"],
  [/\/api\/files\/pages\/\{pageId\}\/confirm-upload$/, "ConfirmPageUploadRequest"],
  [/\/api\/files\/pages\/\{pageId\}\/regions$/, "CreateRegionRequest"],
  [/\/api\/files\/regions\/\{regionId\}\/status$/, "UpdateRegionStatusRequest"],
  [/\/api\/tasks\/?$/, "CreateTaskRequest"],
  [/\/api\/tasks\/\{taskId\}\/status$/, "UpdateTaskStatusRequest"],
  [/\/api\/tasks\/\{taskId\}\/priority$/, "UpdateTaskPriorityRequest"],
  [/\/api\/tasks\/\{taskId\}\/due-date$/, "UpdateTaskDueDateRequest"],
  [/\/api\/tasks\/\{taskId\}\/submissions$/, "CreateSubmissionRequest"],
  [/\/api\/submissions\/\{submissionId\}\/(mangaka-approve|editor-approve|request-revision|reject)$/, "ReviewActionRequest"],
  [/\/api\/comments\/?$/, "CreateCommentRequest"],
  [/\/api\/publications\/?$/, "CreatePublicationRequest"],
  [/\/api\/publications\/\{publicationId\}\/schedule$/, "SchedulePublicationRequest"],
  [/\/api\/rankings\/import$/, "ImportRankingRequest"],
]

function tagFor(pathName: string): string {
  if (pathName === "/api/health") return "Health"
  if (pathName.includes("/auth/")) return "Auth"
  if (pathName.startsWith("/api/admin")) return "Admin"
  if (pathName.startsWith("/api/dashboard")) return "Dashboard"
  if (pathName.startsWith("/api/series")) return "Series"
  if (pathName.startsWith("/api/manuscripts")) return "Manuscripts"
  if (pathName.startsWith("/api/board")) return "Board"
  if (pathName.startsWith("/api/chapters")) return "Chapters"
  if (pathName.includes("/ai/")) return "AI"
  if (pathName.includes("/regions")) return "Regions"
  if (pathName.startsWith("/api/files")) return "Files"
  if (pathName.startsWith("/api/tasks/types") || pathName.startsWith("/api/task-types")) return "Task Types"
  if (pathName.startsWith("/api/tasks")) return "Tasks"
  if (pathName.startsWith("/api/submissions")) return "Submissions"
  if (pathName.startsWith("/api/comments")) return "Comments"
  if (pathName.startsWith("/api/payroll")) return "Payroll"
  if (pathName.startsWith("/api/publications")) return "Publications"
  if (pathName.startsWith("/api/rankings")) return "Rankings"
  return "MangaFlow"
}

function operationId(method: string, pathName: string): string {
  return `${method}_${pathName.replace(/^\/api\/?/, "").replace(/[{}]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "")}`
}

function successDescription(method: string) {
  if (method === "post") return "Created or action completed"
  if (method === "patch") return "Updated"
  if (method === "delete") return "Deleted"
  return "OK"
}

function applyRequestBody(op: any, method: HttpMethod, pathName: string) {
  if (!["post", "put", "patch"].includes(method)) return
  const match = requestSchemaByPattern.find(([pattern]) => pattern.test(pathName))
  if (!match) return
  op.requestBody = {
    required: method !== "patch",
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${match[1]}` },
      },
    },
  }
}

function enrich(docToPatch: OpenApiDoc) {
  docToPatch.info.description = doc.info.description
  docToPatch.servers = [{ url: "http://localhost:3001", description: "Local development" }]
  docToPatch.tags = tags
  docToPatch.components = {
    ...(docToPatch.components ?? {}),
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas,
  }

  for (const [pathName, pathItem] of Object.entries(docToPatch.paths)) {
    for (const [method, op] of Object.entries(pathItem) as Array<[HttpMethod, any]>) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) continue
      op.tags = [tagFor(pathName)]
      op.operationId = operationId(method, pathName)
      op.summary = op.summary || `${method.toUpperCase()} ${pathName}`
      op.description = op.description || "MangaFlow backend endpoint. See role requirements in route middleware and feature contracts."
      if (pathName !== "/api/health" && !pathName.includes("/auth/login") && !pathName.includes("/auth/refresh-token")) {
        op.security = [{ bearerAuth: [] }]
      }
      op.responses = {
        "200": { description: successDescription(method), content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
        ...(method === "post" ? { "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } } } : {}),
        "400": { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        "401": { description: "Authentication required or token invalid", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        "403": { description: "Forbidden by role or domain access policy", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        "404": { description: "Resource not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        "409": { description: "Workflow state conflict", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
      }
      applyRequestBody(op, method, pathName)
    }
  }
}

async function main() {
  await swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc)
  const outputPath = path.resolve(outputFile)
  const generated = JSON.parse(fs.readFileSync(outputPath, "utf-8")) as OpenApiDoc
  enrich(generated)
  fs.writeFileSync(outputPath, `${JSON.stringify(generated, null, 2)}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
