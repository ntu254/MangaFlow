import { SeriesModel, SeriesMemberModel, UserModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import { audit } from "./audit.service.js";
import { stripMongo } from "../db/models.js";
import type { AuthedRequest } from "../types.js";

function toObject<T>(doc: unknown) {
  return stripMongo(doc) as T;
}

/**
 * Get the current tantou editor for a series.
 * Returns the SeriesMember with role="editor" and status="active".
 */
export async function getTantouEditor(seriesId: string) {
  const member = await SeriesMemberModel.findOne({
    seriesId,
    role: "editor",
    status: "active"
  }).lean();

  if (!member) return null;

  const user = await UserModel.findOne({ id: (member as any).userId }).lean();
  return {
    ...(toObject(member) as any),
    userName: (user as any)?.name ?? "Unknown",
    userEmail: (user as any)?.email ?? ""
  };
}

/**
 * Assign a tantou editor to a series.
 * - Only the Board (or Admin) can assign (flowchart node K)
 * - Only one active editor per series
 * - Updates Series.editorId and Series.editorName
 */
export async function assignTantouEditor(
  req: AuthedRequest,
  seriesId: string,
  editorId: string,
  editorName: string
) {
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");

  // The Editorial Board (or Admin) assigns the Tantou Editor (flowchart node K).
  if (req.actor?.role !== "ADMIN" && req.actor?.role !== "BOARD") {
    throw new AppError(403, "Only the Board can assign a Tantou Editor.", "FORBIDDEN");
  }

  // Verify editor user exists and has EDITOR role
  const editorUser = await UserModel.findOne({ id: editorId }).lean();
  if (!editorUser) throw new AppError(404, "Editor not found.", "USER_NOT_FOUND");
  if ((editorUser as any).role !== "EDITOR") {
    throw new AppError(400, "Assigned user must have EDITOR role.", "VALIDATION_ERROR");
  }

  // Check for existing active editor
  const existingEditor = await SeriesMemberModel.findOne({
    seriesId,
    role: "editor",
    status: "active"
  }).lean();

  if (existingEditor) {
    throw new AppError(409, "Series already has an active Tantou Editor. Remove the current editor first.", "ALREADY_ASSIGNED");
  }

  const now = nowIso();

  // Create SeriesMember
  const member = await SeriesMemberModel.create({
    id: id("sm"),
    seriesId,
    userId: editorId,
    role: "editor",
    scope: "full_series",
    status: "active",
    assignedChapterIds: [],
    assignedTaskIds: [],
    createdAt: now,
    updatedAt: now
  });

  // Update Series denormalized fields
  await SeriesModel.updateOne(
    { id: seriesId },
    { $set: { editorId, editorName, updatedAt: now } }
  );

  await audit(req, "series.editor_assign", "series", seriesId, { editorId, editorName });

  return toObject(member);
}

/**
 * Remove (deactivate) the tantou editor from a series.
 * - Only the Board (or Admin) can remove (flowchart node K)
 * - Updates Series.editorId and Series.editorName
 */
export async function removeTantouEditor(req: AuthedRequest, seriesId: string) {
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");

  // The Editorial Board (or Admin) manages the Tantou Editor (flowchart node K).
  if (req.actor?.role !== "ADMIN" && req.actor?.role !== "BOARD") {
    throw new AppError(403, "Only the Board can remove a Tantou Editor.", "FORBIDDEN");
  }

  const member = await SeriesMemberModel.findOne({
    seriesId,
    role: "editor",
    status: "active"
  }).lean();

  if (!member) throw new AppError(404, "No active Tantou Editor found.", "EDITOR_NOT_FOUND");

  const now = nowIso();

  // Deactivate the member
  await SeriesMemberModel.updateOne(
    { id: (member as any).id },
    { $set: { status: "inactive", updatedAt: now } }
  );

  // Clear Series denormalized fields
  await SeriesModel.updateOne(
    { id: seriesId },
    { $set: { editorId: "", editorName: "", updatedAt: now } }
  );

  await audit(req, "series.editor_remove", "series", seriesId, {
    editorId: (member as any).userId
  });

  return { id: (member as any).id, seriesId };
}
