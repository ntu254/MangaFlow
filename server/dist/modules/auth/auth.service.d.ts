import type { JwtPayload, TokenPair, AuthUser, UserRole } from "./auth.types.js";
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function createTokenPair(userId: string, role: UserRole): Promise<TokenPair>;
export declare function verifyAccessToken(token: string): Promise<JwtPayload>;
export declare function rotateRefreshToken(oldToken: string): Promise<TokenPair | null>;
export declare function revokeRefreshToken(token: string): Promise<void>;
export declare function revokeAllUserTokens(userId: string): Promise<void>;
export declare function toAuthUser(userId: string): Promise<AuthUser | null>;
//# sourceMappingURL=auth.service.d.ts.map