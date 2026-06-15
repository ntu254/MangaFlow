import { verifyAccessToken } from "../../modules/auth/auth.service.js";
export async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
    }
    const token = header.slice(7);
    try {
        const payload = await verifyAccessToken(token);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}
//# sourceMappingURL=requireAuth.js.map