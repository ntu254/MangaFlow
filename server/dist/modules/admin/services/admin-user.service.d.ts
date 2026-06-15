import type { UserRole } from "../../auth/auth.types.js";
export interface AdminCreateUserInput {
    email: string;
    password: string;
    name: string;
    displayName?: string;
    team?: string;
    notes?: string;
    role: UserRole;
    isActive?: boolean;
}
export interface AdminUpdateUserInput {
    email?: string;
    name?: string;
    displayName?: string;
    team?: string;
    notes?: string;
    role?: UserRole;
    isActive?: boolean;
}
export declare function listAdminUsersService(): Promise<(import("mongoose").FlattenMaps<import("../../auth/auth.model.js").UserDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare function createAdminUserService(input: AdminCreateUserInput): Promise<import("mongoose").Document<unknown, {}, import("../../auth/auth.model.js").UserDocument, {}, {}> & import("../../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function updateAdminUserRoleService(userId: string, role: UserRole): Promise<import("../../auth/auth.types.js").AuthUser | null>;
export declare function updateAdminUserService(actorId: string, userId: string, input: AdminUpdateUserInput): Promise<import("mongoose").Document<unknown, {}, import("../../auth/auth.model.js").UserDocument, {}, {}> & import("../../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function suspendAdminUserService(actorId: string, userId: string): Promise<import("../../auth/auth.types.js").AuthUser | null>;
export declare function activateAdminUserService(userId: string): Promise<import("../../auth/auth.types.js").AuthUser | null>;
export declare function deleteAdminUserService(actorId: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../auth/auth.model.js").UserDocument, {}, {}> & import("../../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=admin-user.service.d.ts.map