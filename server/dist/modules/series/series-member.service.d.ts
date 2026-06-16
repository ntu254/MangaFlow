export declare function addSeriesMemberService(input: {
    seriesId: string;
    userId: string;
    role: "ASSISTANT" | "CO_MANGAKA" | "EDITOR";
    accessScope: "FULL" | "TASK_ONLY";
    actorId: string;
}): Promise<import("mongoose").Document<unknown, {}, import("./series.model.js").SeriesMemberDocument, {}, {}> & import("./series.model.js").SeriesMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function listSeriesMembersService(seriesId: string, actorId: string, actorRole: string): Promise<(import("mongoose").FlattenMaps<import("./series.model.js").SeriesMemberDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare function updateSeriesMemberService(input: {
    seriesId: string;
    memberId: string;
    status: "ACTIVE" | "PAUSED";
    actorId: string;
}): Promise<import("mongoose").Document<unknown, {}, import("./series.model.js").SeriesMemberDocument, {}, {}> & import("./series.model.js").SeriesMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function removeSeriesMemberService(input: {
    seriesId: string;
    memberId: string;
    actorId: string;
}): Promise<import("mongoose").Document<unknown, {}, import("./series.model.js").SeriesMemberDocument, {}, {}> & import("./series.model.js").SeriesMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getEligibleAssistantsService(seriesId: string, actorId: string, actorRole: string): Promise<{
    memberId: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    accessScope: import("./series.model.js").SeriesMemberAccessScope;
}[]>;
//# sourceMappingURL=series-member.service.d.ts.map