import { asyncRoute, ok } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";
import { login, logout, refresh } from "../application/auth.service.js";
import { loginSchema, refreshSchema } from "./auth.schemas.js";

export const loginHandler = asyncRoute(async (req: AuthedRequest, res) => {
  const input = loginSchema.parse(req.body);
  const session = await login(input.email, input.password, req.header("user-agent"), req.ip);
  ok(res, session);
});

export const refreshHandler = asyncRoute(async (req: AuthedRequest, res) => {
  const input = refreshSchema.parse(req.body);
  ok(res, await refresh(input.refreshToken, req.header("user-agent"), req.ip));
});

export const meHandler = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, req.actor);
});

export const logoutHandler = asyncRoute(async (req: AuthedRequest, res) => {
  await logout(typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined, req.actor?.sessionId);
  ok(res, { ok: true }, "Logged out");
});
