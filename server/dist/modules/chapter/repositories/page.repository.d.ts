export declare function createPageRepository(chapterId: string, pageNumber: number): Promise<any>;
export declare function getPagesByChapter(chapterId: string): Promise<any[]>;
export declare function getPageById(pageId: string): Promise<any | null>;
export declare function updatePageStatus(pageId: string, status: string): Promise<any | null>;
interface UploadAssetInput {
    fileAssetId: string;
    r2Key: string;
    originalName: string;
    mimeType: string;
    size: number;
}
export interface ConfirmPageUploadInput {
    pageId: string;
    uploadedBy: string;
    original: UploadAssetInput;
    working: UploadAssetInput;
    thumbnail: UploadAssetInput;
}
export declare function confirmPageUploadRepository(input: ConfirmPageUploadInput): Promise<any>;
export declare function markPageProcessingFailed(pageId: string): Promise<any | null>;
export declare function getFileAssetById(fileAssetId: string): Promise<any | null>;
export declare function getPageWithFileAsset(pageId: string): Promise<any | null>;
export {};
//# sourceMappingURL=page.repository.d.ts.map