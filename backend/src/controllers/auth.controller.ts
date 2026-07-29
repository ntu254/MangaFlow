import { z } from "zod";
import { asyncRoute, ok } from "../lib/http.js";
import { login, logout, refresh } from "../services/auth.service.js";
import type { AuthedRequest } from "../types.js";
import { parseBody } from "../validators/common.js";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export const loginHandler = asyncRoute(async (req: AuthedRequest, res) => {
  const input = parseBody(loginSchema, req);
  const session = await login(input.email, input.password, req.header("user-agent"), req.ip);
  ok(res, session);
});

export const refreshHandler = asyncRoute(async (req: AuthedRequest, res) => {
  const input = parseBody(refreshSchema, req);
  ok(res, await refresh(input.refreshToken, req.header("user-agent"), req.ip));
});

export const meHandler = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, req.actor);
});

export const logoutHandler = asyncRoute(async (req: AuthedRequest, res) => {
  await logout(
    typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined,
    req.actor?.sessionId,
  );
  ok(res, { ok: true }, "Logged out");
});
