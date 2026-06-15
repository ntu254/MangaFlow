export declare function createRegionRepository(pageId: string, regionIndex: number, bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
}): Promise<any>;
export declare function getRegionsByPage(pageId: string): Promise<any[]>;
export declare function getRegionById(regionId: string): Promise<any | null>;
export declare function updateRegionStatus(regionId: string, status: "ACTIVE" | "ARCHIVED"): Promise<any | null>;
export declare function deleteRegionRepository(regionId: string): Promise<any | null>;
//# sourceMappingURL=region.repository.d.ts.map