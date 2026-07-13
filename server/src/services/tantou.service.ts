import { SeriesMemberModel, UserModel } from "../db/models.js";
import { stripMongo } from "../db/models.js";

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
