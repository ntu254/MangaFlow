import { SeriesMemberModel, UserModel, stripMongo } from "../../../db/models.js";

function toObject<T>(doc: unknown) {
  return stripMongo(doc) as T;
}

export async function getTantouEditor(seriesId: string) {
  const member = await SeriesMemberModel.findOne({
    seriesId,
    role: "editor",
    status: "active",
  }).lean();

  if (!member) return null;

  const user = await UserModel.findOne({ id: (member as any).userId }).lean();
  return {
    ...(toObject(member) as any),
    userName: (user as any)?.name ?? "Unknown",
    userEmail: (user as any)?.email ?? "",
  };
}
