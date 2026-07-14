import { UserModel, stripMongo } from "../../../db/models.js";
import { publicUser } from "../../../domain/roles.js";
import type { AuthUser } from "../../../types.js";

function toAuthUser(user: unknown) {
  return publicUser(stripMongo(user) as unknown as AuthUser);
}

export async function findActiveAuthUserByEmail(email: string) {
  const user = await UserModel.findOne({
    email: email.toLowerCase().trim(),
    active: true,
  }).lean();
  return user ? { raw: user as any, authUser: toAuthUser(user) } : null;
}

export async function findActiveAuthUserById(userId: string) {
  const user = await UserModel.findOne({ id: userId, active: true }).lean();
  return user ? toAuthUser(user) : null;
}
