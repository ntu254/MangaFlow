import { asyncRoute, ok, AppError } from "../lib/http.js";
import { AiProcessingModel, ChapterModel, StudioRegionModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import {
  createDisplayUrl,
  deleteStoredObject,
  persistGeneratedObject,
  readStoredObject,
} from "../services/file-access.service.js";
import { assertCanRunPageAi } from "../services/studio-access.service.js";
import type { AuthedRequest } from "../types.js";

function sanitizeAiPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAiPayload);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !key.toLowerCase().includes("base64"))
      .map(([key, nested]) => [key, sanitizeAiPayload(nested)])
  );
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return { status: response.status, text: await response.text().catch(() => "") };
  }
}

async function upstreamPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return safeJson(response);
  return Buffer.from(await response.arrayBuffer());
}

async function proxyAiFile(req: AuthedRequest, url: string, action: string) {
  if (!req.file) throw new AppError(400, "file multipart field is required.", "VALIDATION_ERROR");
  const form = new FormData();
  form.set("file", new Blob([req.file.buffer as unknown as BlobPart], { type: req.file.mimetype }), req.file.originalname);
  for (const [key, value] of Object.entries(req.body ?? {})) {
    if (typeof value === "string") form.set(key, value);
  }

  const response = await fetch(url, { method: "POST", body: form });
  const payload = await safeJson(response);
  if (!response.ok) {
    throw new AppError(response.status, String((payload as any)?.error ?? (payload as any)?.message ?? "AI service request failed."), "AI_SERVICE_ERROR");
  }

  const normalized = sanitizeAiPayload(payload);
  await (AiProcessingModel as any).create({
    id: id("ai"),
    action,
    actorId: req.actor?.id,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    upstreamStatus: response.status,
    metadata: normalized,
    createdAt: nowIso()
  });
  await audit(req, `ai.${action}`, "ai_processing", req.file.originalname, { size: req.file.size });
  return normalized;
}

function normalizeBubbles(payload: unknown) {
  const bubbles = Array.isArray((payload as any)?.bubbles)
    ? (payload as any).bubbles
    : Array.isArray((payload as any)?.regions)
      ? (payload as any).regions
      : [];

  return bubbles
    .map((bubble: any, index: number) => {
      const bbox = bubble?.bbox ?? bubble;
      const x = Number(bbox?.x ?? bbox?.left ?? 0);
      const y = Number(bbox?.y ?? bbox?.top ?? 0);
      const width =
        bbox?.width != null
          ? Number(bbox.width)
          : bbox?.w != null
            ? Number(bbox.w)
            : Number(bbox?.right ?? 0) - Number(bbox?.left ?? 0);
      const height =
        bbox?.height != null
          ? Number(bbox.height)
          : bbox?.h != null
            ? Number(bbox.h)
            : Number(bbox?.bottom ?? 0) - Number(bbox?.top ?? 0);
      if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
      return {
        index,
        x,
        y,
        width,
        height,
        confidence: typeof bubble?.confidence === "number" ? bubble.confidence : undefined,
        hasMask: Boolean(bubble?.has_mask ?? bubble?.hasMask ?? false),
      };
    })
    .filter(Boolean) as Array<{
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
    hasMask: boolean;
  }>;
}

async function assertLatestAiDetection(pageId: string, expectedProcessingId?: unknown) {
  const expected = typeof expectedProcessingId === "string" ? expectedProcessingId.trim() : "";
  if (!expected) return;
  const latest = await StudioRegionModel.findOne({
    pageId,
    "metadata.source": "ai",
    "metadata.kind": "bubble.detect",
  })
    .sort({ createdAt: -1 })
    .lean();
  const latestProcessingId = String((latest as any)?.metadata?.processingId ?? "");
  if (!latestProcessingId || latestProcessingId !== expected) {
    throw new AppError(
      409,
      "AI detection result is stale. Run detection again before whitening.",
      "AI_RESULT_STALE",
    );
  }
}

async function createProcessingRecord(input: {
  req: AuthedRequest;
  action: string;
  fileName?: string;
  mimeType?: string;
  size: number;
  upstreamStatus: number;
  metadata: unknown;
}) {
  const processing = await (AiProcessingModel as any).create({
    id: id("ai"),
    action: input.action,
    actorId: input.req.actor?.id,
    fileName: input.fileName ?? "page.png",
    mimeType: input.mimeType ?? "image/png",
    size: input.size,
    upstreamStatus: input.upstreamStatus,
    metadata: sanitizeAiPayload(input.metadata),
    createdAt: nowIso(),
  });
  return processing;
}

export function createAiHandlers(aiServiceUrl: string) {
  const health = asyncRoute(async (_req: AuthedRequest, res) => {
    const response = await fetch(`${aiServiceUrl}/health`);
    ok(res, { status: response.ok ? "ok" : "degraded", upstream: await safeJson(response) });
  });

  const detectBubbles = asyncRoute(async (req: AuthedRequest, res) => {
    ok(res, await proxyAiFile(req, `${aiServiceUrl}/bubble/detect`, "bubble.detect"));
  });

  const processBubbles = asyncRoute(async (req: AuthedRequest, res) => {
    ok(res, await proxyAiFile(req, `${aiServiceUrl}/bubble/process`, "bubble.process"));
  });

  const detectPageBubbles = asyncRoute(async (req: AuthedRequest, res) => {
    if (!req.actor) throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");
    const pageId = String(req.params.pageId);
    const { chapter, page, series } = await assertCanRunPageAi(req.actor, pageId);
    if (!page?.fileKey) throw new AppError(400, "Page has no durable file key.", "PAGE_FILE_MISSING");

    const bytes = await readStoredObject(page.fileKey, page.fileUrl ?? page.imageUrl);
    const form = new FormData();
    form.set(
      "file",
      new Blob([bytes as unknown as BlobPart], { type: page.mimeType ?? "image/png" }),
      page.fileName ?? `${pageId}.png`,
    );

    const response = await fetch(`${aiServiceUrl}/bubble/detect`, { method: "POST", body: form });
    const payload = await upstreamPayload(response);
    if (!response.ok || Buffer.isBuffer(payload)) {
      const message = Buffer.isBuffer(payload)
        ? "AI service request failed."
        : String((payload as any)?.error ?? (payload as any)?.message ?? "AI service request failed.");
      throw new AppError(response.status, message, "AI_SERVICE_ERROR");
    }

    const processing = await createProcessingRecord({
      req,
      action: "studio.page.bubble.detect",
      fileName: page.fileName,
      mimeType: page.mimeType,
      size: bytes.length,
      upstreamStatus: response.status,
      metadata: payload,
    });
    const processingId = String((processing as any).id);
    const bubbles = normalizeBubbles(payload);

    await StudioRegionModel.deleteMany({
      pageId,
      "metadata.source": "ai",
      "metadata.kind": "bubble.detect",
    });

    const regions = bubbles.length
      ? await StudioRegionModel.insertMany(
          bubbles.map((bubble) => ({
            id: id("reg"),
            chapterId: (chapter as any).id,
            pageId,
            seriesId: (series as any).id,
            type: "speech_bubble",
            status: "DETECTED",
            x: bubble.x,
            y: bubble.y,
            width: bubble.width,
            height: bubble.height,
            label: `Detected Region ${String(bubble.index + 1).padStart(2, "0")}`,
            metadata: {
              source: "ai",
              kind: "bubble.detect",
              processingId,
              confidence: bubble.confidence,
              hasMask: bubble.hasMask,
            },
            createdAt: nowIso(),
            updatedAt: nowIso(),
          })),
        )
      : [];

    await audit(req, "ai.studio_page.detect_bubbles", "page", pageId, {
      processingId,
      regionCount: regions.length,
    });
    ok(res, { pageId, processingId, regions });
  });

  const whitenPageBubbles = asyncRoute(async (req: AuthedRequest, res) => {
    if (!req.actor) throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");
    const pageId = String(req.params.pageId);
    const { chapter, page } = await assertCanRunPageAi(req.actor, pageId);
    if (!page?.fileKey) throw new AppError(400, "Page has no durable file key.", "PAGE_FILE_MISSING");
    await assertLatestAiDetection(pageId, req.body?.expectedProcessingId);

    const sourceBytes = await readStoredObject(page.fileKey, page.fileUrl ?? page.imageUrl);
    const form = new FormData();
    form.set(
      "file",
      new Blob([sourceBytes as unknown as BlobPart], { type: page.mimeType ?? "image/png" }),
      page.fileName ?? `${pageId}.png`,
    );

    const response = await fetch(`${aiServiceUrl}/bubble/whiten`, { method: "POST", body: form });
    const payload = await upstreamPayload(response);
    if (!response.ok || !Buffer.isBuffer(payload)) {
      const message = Buffer.isBuffer(payload)
        ? "AI service request failed."
        : String((payload as any)?.error ?? (payload as any)?.message ?? "AI service request failed.");
      throw new AppError(response.status, message, "AI_SERVICE_ERROR");
    }

    const processing = await createProcessingRecord({
      req,
      action: "studio.page.bubble.whiten",
      fileName: page.fileName,
      mimeType: "image/png",
      size: sourceBytes.length,
      upstreamStatus: response.status,
      metadata: { pageId, outputSize: payload.length, contentType: "image/png" },
    });
    const processingId = String((processing as any).id);
    const fileKey = `ai/pages/${pageId}/${id("file")}-whitened.png`;
    const fileUrl = await persistGeneratedObject({
      key: fileKey,
      bytes: payload,
      contentType: "image/png",
    });
    try {
      const pages = ((chapter as any).pages ?? []).map((item: any) =>
        item.id === pageId
          ? {
              ...item,
              metadata: {
                ...(item.metadata ?? {}),
                aiWhitened: {
                  fileKey,
                  fileUrl,
                  processingId,
                  mimeType: "image/png",
                  generatedAt: nowIso(),
                },
              },
            }
          : item,
      );
      const attached = await ChapterModel.updateOne(
        {
          id: (chapter as any).id,
          status: { $in: ["PLANNED", "IN_PRODUCTION", "REVISION_REQUIRED"] },
          "pages.id": pageId,
        },
        { $set: { pages, updatedAt: nowIso() } },
      );
      if (attached.matchedCount < 1) {
        throw new AppError(
          409,
          "Chapter content is locked while Tantou review is active.",
          "CHAPTER_REVIEW_LOCKED",
        );
      }
      if (attached.modifiedCount < 1) {
        throw new AppError(409, "AI output could not be attached to the current page.", "AI_ATTACH_FAILED");
      }
    } catch (error) {
      await deleteStoredObject(fileKey).catch(() => undefined);
      throw error;
    }
    await audit(req, "ai.studio_page.whiten_bubbles", "page", pageId, {
      processingId,
      fileKey,
    });
    ok(res, {
      pageId,
      processingId,
      fileKey,
      fileUrl: createDisplayUrl(fileKey, "manga_bubble_whitened.png").url,
      metadata: { mimeType: "image/png" },
    });
  });

  return { health, detectBubbles, processBubbles, detectPageBubbles, whitenPageBubbles };
}
