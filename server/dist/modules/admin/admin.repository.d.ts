import type { TaskTypeInput, TaskTypeUpdateInput } from "../task/task-type.types.js";
export declare function listUsers(): import("mongoose").Query<(import("mongoose").FlattenMaps<import("../auth/auth.model.js").UserDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[], import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../auth/auth.model.js").UserDocument, "find", {}>;
export declare function getUserById(userId: string): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../auth/auth.model.js").UserDocument, "findOne", {}>;
export declare function getUserByEmail(email: string): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../auth/auth.model.js").UserDocument, "findOne", {}>;
export declare function createUser(input: {
    email: string;
    passwordHash: string;
    name: string;
    displayName?: string;
    team?: string;
    notes?: string;
    role: string;
    isActive?: boolean;
}): Promise<import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function updateUser(userId: string, updates: {
    email?: string;
    name?: string;
    displayName?: string;
    team?: string;
    notes?: string;
    role?: string;
    isActive?: boolean;
}): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../auth/auth.model.js").UserDocument, "findOneAndUpdate", {}>;
export declare function deleteUser(userId: string): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../auth/auth.model.js").UserDocument, "findOneAndDelete", {}>;
export declare function listBoardMembers(): import("mongoose").Query<(import("mongoose").FlattenMaps<import("../board/board.model.js").BoardMemberDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[], import("mongoose").Document<unknown, {}, import("../board/board.model.js").BoardMemberDocument, {}, {}> & import("../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../board/board.model.js").BoardMemberDocument, "find", {}>;
export declare function getBoardMemberByUser(userId: string): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../board/board.model.js").BoardMemberDocument, {}, {}> & import("../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../board/board.model.js").BoardMemberDocument, {}, {}> & import("../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../board/board.model.js").BoardMemberDocument, "findOne", {}>;
export declare function upsertBoardMember(userId: string): import("mongoose").Query<import("mongoose").Document<unknown, {}, import("../board/board.model.js").BoardMemberDocument, {}, {}> & import("../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, import("mongoose").Document<unknown, {}, import("../board/board.model.js").BoardMemberDocument, {}, {}> & import("../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../board/board.model.js").BoardMemberDocument, "findOneAndUpdate", {}>;
export declare function updateBoardMember(userId: string, updates: {
    isActive?: boolean;
    isChair?: boolean;
}): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../board/board.model.js").BoardMemberDocument, {}, {}> & import("../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../board/board.model.js").BoardMemberDocument, {}, {}> & import("../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../board/board.model.js").BoardMemberDocument, "findOneAndUpdate", {}>;
export declare function clearBoardChairs(exceptUserId?: string): import("mongoose").Query<import("mongoose").UpdateWriteOpResult, import("mongoose").Document<unknown, {}, import("../board/board.model.js").BoardMemberDocument, {}, {}> & import("../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../board/board.model.js").BoardMemberDocument, "updateMany", {}>;
export declare function countActiveUsers(): import("mongoose").Query<number, import("mongoose").Document<unknown, {}, import("../auth/auth.model.js").UserDocument, {}, {}> & import("../auth/auth.model.js").UserDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../auth/auth.model.js").UserDocument, "countDocuments", {}>;
export declare function countSeries(): import("mongoose").Query<number, import("mongoose").Document<unknown, {}, import("../series/series.model.js").SeriesDocument, {}, {}> & import("../series/series.model.js").SeriesDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../series/series.model.js").SeriesDocument, "countDocuments", {}>;
export declare function countActiveTasks(): import("mongoose").Query<number, import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskDocument, {}, {}> & import("../task/task.model.js").TaskDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../task/task.model.js").TaskDocument, "countDocuments", {}>;
export declare function countBoardMembers(): import("mongoose").Query<number, import("mongoose").Document<unknown, {}, import("../board/board.model.js").BoardMemberDocument, {}, {}> & import("../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../board/board.model.js").BoardMemberDocument, "countDocuments", {}>;
export declare function countTaskTypes(): import("mongoose").Query<number, import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../task/task.model.js").TaskTypeDocument, "countDocuments", {}>;
export declare function listTaskTypes(): import("mongoose").Query<(import("mongoose").FlattenMaps<import("../task/task.model.js").TaskTypeDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[], import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../task/task.model.js").TaskTypeDocument, "find", {}>;
export declare function getTaskType(taskTypeId: string): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../task/task.model.js").TaskTypeDocument, "findOne", {}>;
export declare function getTaskTypeByName(name: string): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../task/task.model.js").TaskTypeDocument, "findOne", {}>;
export declare function getTaskTypeByCode(code: string): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../task/task.model.js").TaskTypeDocument, "findOne", {}>;
export declare function createTaskType(input: TaskTypeInput): Promise<import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function updateTaskType(taskTypeId: string, updates: TaskTypeUpdateInput): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../task/task.model.js").TaskTypeDocument, "findOneAndUpdate", {}>;
export declare function taskTypeInUse(taskTypeId: string): import("mongoose").Query<{
    _id: import("mongoose").Types.ObjectId;
} | null, import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskDocument, {}, {}> & import("../task/task.model.js").TaskDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../task/task.model.js").TaskDocument, "findOne", {}>;
export declare function deleteTaskType(taskTypeId: string): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null, import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskTypeDocument, {}, {}> & import("../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, {}, import("../task/task.model.js").TaskTypeDocument, "findOneAndDelete", {}>;
//# sourceMappingURL=admin.repository.d.ts.map