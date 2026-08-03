export type MaterialAttachmentMigrationPlan =
  | { action: "SKIP" }
  | { action: "CLEAN_STATUS" }
  | { action: "REMOVE"; reason: "ARCHIVED" };

export function planMaterialAttachmentMigration(record: {
  id?: unknown;
  status?: unknown;
  metadata?: unknown;
}): MaterialAttachmentMigrationPlan {
  const hasTopLevelStatus =
    Object.prototype.hasOwnProperty.call(record, "status") && record.status !== undefined;
  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Record<string, unknown>)
      : undefined;
  const hasMetadataStatus =
    Boolean(metadata) &&
    Object.prototype.hasOwnProperty.call(metadata, "status") &&
    metadata?.status !== undefined;

  if (record.status === "ARCHIVED" || (!hasTopLevelStatus && metadata?.status === "ARCHIVED")) {
    return { action: "REMOVE", reason: "ARCHIVED" };
  }
  if (hasTopLevelStatus || hasMetadataStatus) return { action: "CLEAN_STATUS" };
  return { action: "SKIP" };
}

type EmbeddedFile = Record<string, unknown>;

function stripEmbeddedStatus(value: EmbeddedFile) {
  let changed = false;
  const next = { ...value };
  if (Object.prototype.hasOwnProperty.call(next, "status")) {
    delete next.status;
    changed = true;
  }
  if (next.metadata && typeof next.metadata === "object") {
    const metadata = { ...(next.metadata as Record<string, unknown>) };
    if (Object.prototype.hasOwnProperty.call(metadata, "status")) {
      delete metadata.status;
      changed = true;
      if (Object.keys(metadata).length > 0) next.metadata = metadata;
      else delete next.metadata;
    }
  }
  return { changed, value: next };
}

export function cleanProposalAttachmentArrays(record: {
  manuscripts?: EmbeddedFile[];
  materials?: EmbeddedFile[];
}) {
  let changed = false;
  const manuscripts = (record.manuscripts ?? []).map((item) => {
    const cleaned = stripEmbeddedStatus(item);
    changed ||= cleaned.changed;
    return cleaned.value;
  });
  const materials = (record.materials ?? []).flatMap((item) => {
    const plan = planMaterialAttachmentMigration(item);
    if (plan.action === "REMOVE") {
      changed = true;
      return [];
    }
    const cleaned = stripEmbeddedStatus(item);
    changed ||= cleaned.changed;
    return [cleaned.value];
  });
  return { changed, manuscripts, materials };
}
