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
//# sourceMappingURL=series-member.service.d.ts.map