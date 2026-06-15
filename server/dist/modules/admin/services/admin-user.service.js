import { AppError } from "../../../shared/errors/AppError.js";
import { hashPassword, revokeAllUserTokens, toAuthUser } from "../../auth/auth.service.js";
import * as repository from "../admin.repository.js";
export async function listAdminUsersService() {
    return repository.listUsers();
}
export async function createAdminUserService(input) {
    const existing = await repository.getUserByEmail(input.email);
    if (existing)
        throw new AppError("Email already registered", 409);
    const passwordHash = await hashPassword(input.password);
    const user = await repository.createUser({
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        displayName: input.displayName,
        team: input.team,
        notes: input.notes,
        role: input.role,
        isActive: input.isActive,
    });
    return user;
}
export async function updateAdminUserRoleService(userId, role) {
    const user = await repository.updateUser(userId, { role });
    if (!user)
        throw new AppError("User not found", 404);
    if (role !== "BOARD") {
        const member = await repository.getBoardMemberByUser(userId);
        if (member)
            await repository.updateBoardMember(userId, { isActive: false, isChair: false });
    }
    await revokeAllUserTokens(userId);
    return toAuthUser(user.id);
}
export async function updateAdminUserService(actorId, userId, input) {
    const existing = await repository.getUserById(userId);
    if (!existing)
        throw new AppError("User not found", 404);
    if (input.isActive === false && actorId === userId) {
        throw new AppError("Admin cannot suspend their own account", 409);
    }
    if (input.email && input.email.toLowerCase() !== existing.email) {
        const emailOwner = await repository.getUserByEmail(input.email);
        if (emailOwner && String(emailOwner.id) !== userId)
            throw new AppError("Email already registered", 409);
    }
    const updates = {
        ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.team !== undefined ? { team: input.team } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    };
    const user = await repository.updateUser(userId, updates);
    if (!user)
        throw new AppError("User not found", 404);
    if (input.role && input.role !== "BOARD") {
        const member = await repository.getBoardMemberByUser(userId);
        if (member)
            await repository.updateBoardMember(userId, { isActive: false, isChair: false });
    }
    if (input.role || input.email || input.isActive === false) {
        await revokeAllUserTokens(userId);
    }
    return user;
}
export async function suspendAdminUserService(actorId, userId) {
    if (actorId === userId)
        throw new AppError("Admin cannot suspend their own account", 409);
    const user = await repository.updateUser(userId, { isActive: false });
    if (!user)
        throw new AppError("User not found", 404);
    await revokeAllUserTokens(userId);
    return toAuthUser(user.id);
}
export async function activateAdminUserService(userId) {
    const user = await repository.updateUser(userId, { isActive: true });
    if (!user)
        throw new AppError("User not found", 404);
    return toAuthUser(user.id);
}
export async function deleteAdminUserService(actorId, userId) {
    if (actorId === userId)
        throw new AppError("Admin cannot delete their own account", 409);
    const user = await repository.deleteUser(userId);
    if (!user)
        throw new AppError("User not found", 404);
    const member = await repository.getBoardMemberByUser(userId);
    if (member)
        await repository.updateBoardMember(userId, { isActive: false, isChair: false });
    await revokeAllUserTokens(userId);
    return user;
}
//# sourceMappingURL=admin-user.service.js.map