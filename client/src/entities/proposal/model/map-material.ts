import type {
  SeriesMaterial,
  SeriesMaterialKind,
  SeriesMaterialStatus,
  SeriesMaterialVersion,
  MaterialItem,
  MaterialVersionItem,
} from "@/entities/series/model/series-types";

const KIND_VALUES: SeriesMaterialKind[] = [
  "storyboard",
  "manuscript",
  "character",
  "background",
  "moodboard",
  "reference",
  "sfx",
  "style_guide",
  "brush",
  "other",
];

const STATUS_VALUES: SeriesMaterialStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"];

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizeKind(value: unknown): SeriesMaterialKind {
  const kind = asString(value);
  return kind && (KIND_VALUES as string[]).includes(kind) ? (kind as SeriesMaterialKind) : "other";
}

function normalizeStatus(value: unknown): SeriesMaterialStatus {
  const status = asString(value);
  return status && (STATUS_VALUES as string[]).includes(status)
    ? (status as SeriesMaterialStatus)
    : "DRAFT";
}

function meta(item: { metadata?: Record<string, unknown> }): Record<string, unknown> {
  return item.metadata ?? {};
}

function mapVersion(v: MaterialVersionItem): SeriesMaterialVersion {
  const m = meta(v);
  return {
    id: v.id,
    version: v.version,
    fileName: asString(m.fileName) ?? v.fileKey ?? "file",
    // fileUrl resolved on demand via fileKey; stored url is a fallback only.
    fileUrl: v.url ?? "",
    fileType: asString(m.fileType) ?? v.mimeType ?? "application/octet-stream",
    sizeKB: typeof v.size === "number" ? Math.round(v.size / 1024) : 0,
    uploadedById: v.uploadedById ?? "",
    uploadedByName: v.uploadedByName ?? "",
    uploadedAt: v.uploadedAt ?? new Date().toISOString(),
    note: v.note ?? asString(m.note),
    fileKey: v.fileKey,
  };
}

/**
 * Map a backend MaterialItem to the SeriesMaterial shape used by the
 * Series Materials Library UI. Display-only fields (status, fileName,
 * fileType, note) live in metadata because the backend lacks first-class
 * columns for them; this is tracked as a backend-contract follow-up.
 *
 * Versions are returned newest-first to match the existing UI which reads
 * `versions[0]` as the current version.
 */
export function mapApiMaterialToSeriesMaterial(item: MaterialItem): SeriesMaterial {
  const m = meta(item);
  const versions = (item.versions ?? []).map(mapVersion);
  // UI expects newest-first.
  versions.sort((a, b) => b.version - a.version);

  return {
    id: item.id,
    seriesId: item.seriesId ?? "",
    title: item.title ?? "",
    kind: normalizeKind(item.kind ?? m.kind),
    status: normalizeStatus(m.status ?? item.status),
    chapterId: item.chapterId ?? undefined,
    tags: Array.isArray(item.tags) ? item.tags : [],
    note: asString(m.note),
    currentVersion: item.currentVersion ?? versions[0]?.version ?? 1,
    versions,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
