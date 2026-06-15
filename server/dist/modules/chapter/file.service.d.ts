export interface PresignedUploadResult {
    uploadUrl: string;
    fileAssetId: string;
    r2Key: string;
    expiresIn: number;
}
export interface PresignedDownloadResult {
    downloadUrl: string;
    expiresIn: number;
}
export declare function createPresignedUploadUrl(originalName: string, contentType: string, expiresIn?: number): Promise<PresignedUploadResult>;
export declare function createPresignedDownloadUrl(r2Key: string, expiresIn?: number): Promise<PresignedDownloadResult>;
export declare function deleteFileAsset(r2Key: string): Promise<void>;
export declare function getFileBuffer(r2Key: string): Promise<Buffer>;
export declare function uploadBuffer(buffer: Buffer, originalName: string, contentType: string): Promise<{
    fileAssetId: string;
    r2Key: string;
    size: number;
}>;
export declare function validateFileType(mimeType: string, allowedTypes: string[]): boolean;
export declare function validateFileSize(size: number, maxSizeMB: number): boolean;
//# sourceMappingURL=file.service.d.ts.map