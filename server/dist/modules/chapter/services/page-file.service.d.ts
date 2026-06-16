import { type AccessActor } from "../../../shared/policies/accessPolicy.service.js";
export interface GetPresignedUploadUrlInput {
    originalName: string;
    contentType: string;
    expiresIn?: number;
}
export declare function getPresignedUploadUrlService(input: GetPresignedUploadUrlInput): Promise<import("../file.service.js").PresignedUploadResult>;
export interface UploadAssetInput {
    fileAssetId: string;
    r2Key: string;
    originalName: string;
    mimeType: string;
    size: number;
}
export interface ConfirmPageUploadInput {
    pageId: string;
    original: UploadAssetInput;
    working: UploadAssetInput;
    thumbnail: UploadAssetInput;
    userId: string;
    actor: AccessActor;
}
export declare function confirmPageUploadService(input: ConfirmPageUploadInput): Promise<{
    page: any;
    originalAsset: any;
    workingAsset: any;
    thumbnailAsset: any;
}>;
export declare function getPresignedDownloadUrlService(fileAssetId: string, actor: AccessActor, expiresIn?: number): Promise<import("../file.service.js").PresignedDownloadResult>;
export declare function getPageWithFileAssetService(pageId: string, actor: AccessActor): Promise<any>;
//# sourceMappingURL=page-file.service.d.ts.map