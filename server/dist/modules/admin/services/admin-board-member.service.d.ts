export declare function listAdminBoardMembersService(): Promise<(import("mongoose").FlattenMaps<import("../../board/board.model.js").BoardMemberDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare function addAdminBoardMemberService(userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../board/board.model.js").BoardMemberDocument, {}, {}> & import("../../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function activateAdminBoardMemberService(userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../board/board.model.js").BoardMemberDocument, {}, {}> & import("../../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function deactivateAdminBoardMemberService(userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../board/board.model.js").BoardMemberDocument, {}, {}> & import("../../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function setAdminBoardChairService(userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../board/board.model.js").BoardMemberDocument, {}, {}> & import("../../board/board.model.js").BoardMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=admin-board-member.service.d.ts.map