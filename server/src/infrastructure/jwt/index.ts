import jwt from "jsonwebtoken";

const JWT_ALGORITHM = "HS256";
const JWT_EXPIRY = "7d";

export type JwtPayload = {
  sub: string;
  systemRole: string | null;
  status: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

export function signJwt(payload: Omit<JwtPayload, "iat" | "exp">, secret: string): string {
  return jwt.sign(payload, secret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRY,
  });
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    }) as jwt.JwtPayload & JwtPayload;

    return {
      sub: decoded.sub ?? "",
      systemRole: decoded.systemRole ?? null,
      status: decoded.status ?? "ACTIVE",
      email: decoded.email ?? "",
      fullName: decoded.fullName ?? "",
      avatarUrl: decoded.avatarUrl ?? null,
    };
  } catch {
    return null;
  }
}
