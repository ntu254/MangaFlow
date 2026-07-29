import { SeriesModel } from "../db/models.js";
import { nowIso } from "../domain/ids.js";
import type { ClientSession } from "mongoose";

export function cadenceFromPublicationType(value: unknown) {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "WEEKLY") return "weekly";
  return "monthly";
}

export function normalizePublicationType(value: unknown) {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "WEEKLY" || normalized === "MONTHLY") return normalized;
  return null;
}

function slugifySeries(input: string, fallback: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || fallback;
}

export async function ensureProductionSeriesForApprovedProposal(
  proposal: any,
  session?: ClientSession,
) {
  if (!proposal || proposal.status !== "APPROVED") return null;

  const proposalVersionId = String(
    proposal.sourceProposalVersionId ??
      proposal.activeProposalVersionId ??
      proposal.currentVersionId ??
      proposal.currentVersion ??
      proposal.version ??
      proposal.manuscripts?.[proposal.manuscripts.length - 1]?.version ??
      "1",
  );
  const existingQuery = SeriesModel.findOne({ sourceProposalId: proposal.id });
  if (session) existingQuery.session(session);
  const existing: any = await existingQuery.lean();
  const seriesId = `s-${proposal.id}`;
  const seriesSlug = slugifySeries(String(proposal.slug || proposal.title || seriesId), seriesId);
  const pubSource = proposal.boardApprovedPublicationType ?? proposal.requestedPublicationType;
  const desiredPublicationType = normalizePublicationType(pubSource);
  const desiredCadence = cadenceFromPublicationType(pubSource);
  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.slug) patch.slug = seriesSlug;
    if (!existing.sourceProposalVersionId) patch.sourceProposalVersionId = proposalVersionId;
    // The series may have been created earlier (e.g. on vote quorum) before the
    // Board picked a publication type at finalize — apply the chosen type/cadence.
    if (proposal.boardApprovedPublicationType) {
      patch.publicationType = desiredPublicationType;
      patch.cadence = desiredCadence;
    }
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = nowIso();
      await SeriesModel.updateOne({ id: existing.id }, { $set: patch }, { session });
      const updatedQuery = SeriesModel.findOne({ id: existing.id });
      if (session) updatedQuery.session(session);
      return updatedQuery.lean();
    }
    return existing;
  }

  const now = nowIso();
  const editorId = proposal.assignedEditorId ?? proposal.claimedByEditorId ?? "u-editor";
  const editorName = proposal.assignedEditorName ?? proposal.claimedByEditorName ?? "Tanaka Akira";

  const seriesQuery = SeriesModel.findOneAndUpdate(
    { sourceProposalId: proposal.id },
    {
      $setOnInsert: {
        id: seriesId,
        slug: seriesSlug,
        title: proposal.title ?? "Untitled series",
        synopsis: proposal.synopsis ?? "",
        genres: Array.isArray(proposal.genres) ? proposal.genres : [],
        coverUrl: proposal.coverUrl ?? "",
        coverFileKey: proposal.coverFileKey,
        status: "PRE_PRODUCTION",
        visibility: "PRIVATE",
        publicationType: desiredPublicationType,
        cadence: desiredCadence,
        startDate: now,
        targetChapters: Number(proposal.chaptersPlanned ?? 12),
        authorId: proposal.authorId,
        authorName: proposal.authorName,
        editorId,
        editorName,
        assistantIds: [],
        proposalId: proposal.id,
        sourceProposalId: proposal.id,
        sourceProposalVersionId: proposalVersionId,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (session) seriesQuery.session(session);
  return seriesQuery.lean();
}
