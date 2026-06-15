import type { UserRole } from "../auth/auth.types.js";
interface PublicationActor {
    userId: string;
    role: UserRole;
}
export declare function createPublicationService(input: {
    chapterId: string;
    scheduledFor?: string | Date;
    actor: PublicationActor;
}): Promise<import("mongoose").Document<unknown, {}, import("./publication.model.js").PublicationDocument, {}, {}> & import("./publication.model.js").PublicationDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function schedulePublicationService(input: {
    publicationId: string;
    scheduledFor: string | Date;
    actor: PublicationActor;
}): Promise<(import("mongoose").Document<unknown, {}, import("./publication.model.js").PublicationDocument, {}, {}> & import("./publication.model.js").PublicationDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function publishPublicationService(publicationId: string, actor: PublicationActor): Promise<(import("mongoose").Document<unknown, {}, import("./publication.model.js").PublicationDocument, {}, {}> & import("./publication.model.js").PublicationDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export {};
//# sourceMappingURL=publication.service.d.ts.map