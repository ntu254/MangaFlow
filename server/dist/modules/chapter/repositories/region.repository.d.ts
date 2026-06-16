import { type RegionStatus, type RegionType } from "../chapter.model.js";
export interface CreateRegionInput {
    pageId: string;
    regionIndex: number;
    type: RegionType;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    source?: "MANUAL" | "AI";
    status?: RegionStatus;
    aiResultId?: string;
    confidence?: number;
}
export declare function createRegionRepository(input: CreateRegionInput): Promise<any>;
export declare function nextRegionIndex(pageId: string): Promise<number>;
export declare function getRegionsByPage(pageId: string): Promise<any[]>;
export declare function getRegionById(regionId: string): Promise<any | null>;
export declare function updateRegionStatusRepository(regionId: string, status: RegionStatus): Promise<any | null>;
export interface UpdateRegionInput {
    type?: RegionType;
    bbox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    status?: RegionStatus;
}
export declare function updateRegionRepository(regionId: string, patch: UpdateRegionInput): Promise<any | null>;
export declare function deleteRegionRepository(regionId: string): Promise<any | null>;
//# sourceMappingURL=region.repository.d.ts.map