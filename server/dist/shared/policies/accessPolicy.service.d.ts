import type { UserRole } from "../../modules/auth/auth.types.js";
export interface AccessActor {
    userId: string;
    role: UserRole;
}
export declare function canReadChapter(actor: AccessActor, chapterId: string): Promise<boolean>;
export declare function assertCanReadChapter(actor: AccessActor, chapterId: string): Promise<void>;
export declare function canReadPage(actor: AccessActor, pageId: string): Promise<boolean>;
export declare function assertCanReadPage(actor: AccessActor, pageId: string): Promise<void>;
export declare function assertCanReadRegion(actor: AccessActor, regionId: string): Promise<void>;
export declare function canWritePage(actor: AccessActor, pageId: string): Promise<boolean>;
export declare function assertCanWritePage(actor: AccessActor, pageId: string): Promise<void>;
export declare function canWriteChapter(actor: AccessActor, chapterId: string): Promise<boolean>;
export declare function assertCanWriteChapter(actor: AccessActor, chapterId: string): Promise<void>;
export declare function canWriteRegion(actor: AccessActor, regionId: string): Promise<boolean>;
export declare function assertCanWriteRegion(actor: AccessActor, regionId: string): Promise<void>;
export declare function assertCanReadFileAsset(actor: AccessActor, fileAssetId: string): Promise<void>;
//# sourceMappingURL=accessPolicy.service.d.ts.map