import type { ManuscriptStatus } from "../../../shared/workflow/status.js";
export declare function hasManuscript(seriesId: string): Promise<boolean>;
export declare function getLatestManuscriptBySeries(seriesId: string): Promise<any | null>;
export interface CreateManuscriptUploadDraftInput {
    seriesId: string;
    uploadedBy: string;
    r2Key: string;
    originalName: string;
    mimeType: string;
    size: number;
    slot?: string;
}
export declare function createManuscriptUploadDraft(input: CreateManuscriptUploadDraftInput): Promise<any>;
export interface CreateSeriesFileAssetDraftInput {
    seriesId: string;
    uploadedBy: string;
    r2Key: string;
    originalName: string;
    mimeType: string;
    size: number;
    assetType: "SUPPORTING";
    slot?: string;
}
export declare function createSeriesFileAssetDraft(input: CreateSeriesFileAssetDraftInput): Promise<any>;
export declare function updateManuscriptStatus(manuscriptId: string, status: ManuscriptStatus, reviewNote?: string): Promise<any | null>;
//# sourceMappingURL=manuscript.repository.d.ts.map