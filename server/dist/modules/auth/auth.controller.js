import { User } from "./auth.model.js";
import { hashPassword, comparePassword, createTokenPair, rotateRefreshToken, revokeRefreshToken, revokeAllUserTokens, toAuthUser, } from "./auth.service.js";
const ROLE_DASHBOARD_MAP = {
    ADMIN: "/admin/dashboard",
    MANGAKA: "/mangaka/dashboard",
    ASSISTANT: "/assistant/dashboard",
    EDITOR: "/editor/dashboard",
    BOARD: "/board/dashboard",
};
export async function adminCreateUser(req, res) {
    const { email, password, name, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        res.status(409).json({ success: false, message: "Email already registered" });
        return;
    }
    const passwordHash = await hashPassword(password);
    const user = await User.create({ email, passwordHash, name, role });
    res.status(201).json({
        success: true,
        message: "User created successfully",
        data: await toAuthUser(user.id),
    });
}
export async function login(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        res.status(401).json({ success: false, message: "Invalid email or password" });
        return;
    }
    if (!user.isActive) {
        res.status(403).json({ success: false, message: "Account is suspended" });
        return;
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ success: false, message: "Invalid email or password" });
        return;
    }
    const tokens = await createTokenPair(user.id, user.role);
    const authUser = await toAuthUser(user.id);
    res.json({
        success: true,
        message: "Login successful",
        data: {
            user: authUser,
            redirectTo: ROLE_DASHBOARD_MAP[user.role] ?? "/app/mangaka/dashboard",
            ...tokens,
        },
    });
}
export async function logout(req, res) {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await revokeRefreshToken(refreshToken);
    }
    if (req.user) {
        await revokeAllUserTokens(req.user.userId);
    }
    res.json({ success: true, message: "Logged out" });
}
export async function refreshToken(req, res) {
    const { refreshToken: token } = req.body;
    const result = await rotateRefreshToken(token);
    if (!result) {
        res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
        return;
    }
    res.json({ success: true, data: result });
}
export async function me(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
    }
    const user = await toAuthUser(req.user.userId);
    if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
    }
    res.json({ success: true, data: user });
}
//# sourceMappingURL=auth.controller.js.map