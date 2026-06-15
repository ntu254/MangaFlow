export declare function getPublicationChapter(chapterId: string): Promise<(import("mongoose").Document<unknown, {}, import("../chapter/chapter.model.js").ChapterDocument, {}, {}> & import("../chapter/chapter.model.js").ChapterDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getPublicationById(publicationId: string): Promise<(import("mongoose").Document<unknown, {}, import("./publication.model.js").PublicationDocument, {}, {}> & import("./publication.model.js").PublicationDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getPublicationByChapter(chapterId: string): Promise<(import("mongoose").Document<unknown, {}, import("./publication.model.js").PublicationDocument, {}, {}> & import("./publication.model.js").PublicationDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function createPublicationRecord(input: {
    chapterId: string;
    seriesId: string;
    createdBy: string;
    scheduledFor?: Date;
}): Promise<import("mongoose").Document<unknown, {}, import("./publication.model.js").PublicationDocument, {}, {}> & import("./publication.model.js").PublicationDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function updatePublicationSchedule(publicationId: string, scheduledFor: Date, actorId: string): Promise<(import("mongoose").Document<unknown, {}, import("./publication.model.js").PublicationDocument, {}, {}> & import("./publication.model.js").PublicationDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function markPublicationPublished(publicationId: string, actorId: string, publishedAt: Date): Promise<(import("mongoose").Document<unknown, {}, import("./publication.model.js").PublicationDocument, {}, {}> & import("./publication.model.js").PublicationDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function updateChapterDraftSchedule(chapterId: string, scheduledFor: Date): Promise<(import("mongoose").Document<unknown, {}, import("../chapter/chapter.model.js").ChapterDocument, {}, {}> & import("../chapter/chapter.model.js").ChapterDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function updateChapterPublicationStatus(chapterId: string, status: "READY_FOR_PUBLICATION" | "PUBLISHED"): Promise<(import("mongoose").Document<unknown, {}, import("../chapter/chapter.model.js").ChapterDocument, {}, {}> & import("../chapter/chapter.model.js").ChapterDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=publication.repository.d.ts.map