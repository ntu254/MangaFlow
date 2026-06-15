import { activateAdminUserService, createAdminUserService, deleteAdminUserService, listAdminUsersService, suspendAdminUserService, updateAdminUserRoleService, updateAdminUserService, addAdminBoardMemberService, activateAdminBoardMemberService, deactivateAdminBoardMemberService, listAdminBoardMembersService, setAdminBoardChairService, activateAdminTaskTypeService, createAdminTaskTypeService, deactivateAdminTaskTypeService, deleteAdminTaskTypeService, listAdminTaskTypesService, updateAdminTaskTypeService, } from "./admin.service.js";
export async function listAdminUsers(_req, res, next) {
    try {
        const users = await listAdminUsersService();
        res.json({ success: true, message: "Admin users retrieved", data: users.map(toAdminUserResponse) });
    }
    catch (err) {
        next(err);
    }
}
export async function createAdminUser(req, res, next) {
    try {
        const user = await createAdminUserService(req.body);
        res.status(201).json({ success: true, message: "User created successfully", data: toAdminUserResponse(user) });
    }
    catch (err) {
        next(err);
    }
}
export async function updateAdminUserRole(req, res, next) {
    try {
        const user = await updateAdminUserRoleService(String(req.params.userId), req.body.role);
        res.json({ success: true, message: "User role updated", data: user });
    }
    catch (err) {
        next(err);
    }
}
export async function updateAdminUser(req, res, next) {
    try {
        const user = await updateAdminUserService(req.user.userId, String(req.params.userId), req.body);
        res.json({ success: true, message: "User updated", data: toAdminUserResponse(user) });
    }
    catch (err) {
        next(err);
    }
}
export async function updateAdminUserStatus(req, res, next) {
    try {
        const isActive = req.body.isActive;
        const user = isActive
            ? await activateAdminUserService(String(req.params.userId))
            : await suspendAdminUserService(req.user.userId, String(req.params.userId));
        res.json({ success: true, message: isActive ? "User activated" : "User suspended", data: user });
    }
    catch (err) {
        next(err);
    }
}
export async function deleteAdminUser(req, res, next) {
    try {
        const user = await deleteAdminUserService(req.user.userId, String(req.params.userId));
        res.json({ success: true, message: "User deleted", data: toAdminUserResponse(user) });
    }
    catch (err) {
        next(err);
    }
}
function toAdminUserResponse(user) {
    return {
        id: String(user._id ?? user.id),
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        team: user.team,
        notes: user.notes,
        role: user.role,
        isActive: Boolean(user.isActive),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
export async function listAdminBoardMembers(_req, res, next) {
    try {
        const members = await listAdminBoardMembersService();
        res.json({ success: true, message: "Admin board members retrieved", data: members.map(toAdminBoardMemberResponse) });
    }
    catch (err) {
        next(err);
    }
}
export async function createAdminBoardMember(req, res, next) {
    try {
        const member = await addAdminBoardMemberService(req.body.userId);
        res.status(201).json({ success: true, message: "Board member added", data: toAdminBoardMemberResponse(member) });
    }
    catch (err) {
        next(err);
    }
}
export async function updateAdminBoardMemberStatus(req, res, next) {
    try {
        const isActive = req.body.isActive;
        const member = isActive
            ? await activateAdminBoardMemberService(String(req.params.userId))
            : await deactivateAdminBoardMemberService(String(req.params.userId));
        res.json({ success: true, message: isActive ? "Board member activated" : "Board member deactivated", data: toAdminBoardMemberResponse(member) });
    }
    catch (err) {
        next(err);
    }
}
export async function updateAdminBoardChair(req, res, next) {
    try {
        const member = await setAdminBoardChairService(String(req.params.userId));
        res.json({ success: true, message: "Board Chair assigned", data: toAdminBoardMemberResponse(member) });
    }
    catch (err) {
        next(err);
    }
}
function toAdminBoardMemberResponse(member) {
    const user = member.userId ?? {};
    return {
        userId: String(user._id ?? user.id ?? member.userId),
        email: user.email,
        name: user.name,
        role: user.role,
        isUserActive: Boolean(user.isActive),
        isActive: Boolean(member.isActive),
        isChair: Boolean(member.isChair),
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
    };
}
export async function listAdminTaskTypes(_req, res, next) {
    try {
        const taskTypes = await listAdminTaskTypesService();
        res.json({ success: true, message: "Admin task types retrieved", data: taskTypes.map(toAdminTaskTypeResponse) });
    }
    catch (err) {
        next(err);
    }
}
export async function createAdminTaskType(req, res, next) {
    try {
        const taskType = await createAdminTaskTypeService(req.body);
        res.status(201).json({ success: true, message: "Task type created", data: toAdminTaskTypeResponse(taskType) });
    }
    catch (err) {
        next(err);
    }
}
export async function updateAdminTaskType(req, res, next) {
    try {
        const taskType = await updateAdminTaskTypeService(String(req.params.taskTypeId), req.body);
        res.json({ success: true, message: "Task type updated", data: toAdminTaskTypeResponse(taskType) });
    }
    catch (err) {
        next(err);
    }
}
export async function updateAdminTaskTypeStatus(req, res, next) {
    try {
        const isActive = req.body.isActive;
        const taskType = isActive
            ? await activateAdminTaskTypeService(String(req.params.taskTypeId))
            : await deactivateAdminTaskTypeService(String(req.params.taskTypeId));
        res.json({ success: true, message: isActive ? "Task type activated" : "Task type deactivated", data: toAdminTaskTypeResponse(taskType) });
    }
    catch (err) {
        next(err);
    }
}
export async function deleteAdminTaskType(req, res, next) {
    try {
        const taskType = await deleteAdminTaskTypeService(String(req.params.taskTypeId));
        res.json({ success: true, message: "Task type deleted", data: taskType ? toAdminTaskTypeResponse(taskType) : null });
    }
    catch (err) {
        next(err);
    }
}
function toAdminTaskTypeResponse(taskType) {
    return {
        id: String(taskType._id ?? taskType.id),
        name: taskType.name,
        description: taskType.description,
        baseRate: Number(taskType.baseRate),
        isActive: Boolean(taskType.isActive),
        createdAt: taskType.createdAt,
        updatedAt: taskType.updatedAt,
    };
}
//# sourceMappingURL=admin.controller.js.map