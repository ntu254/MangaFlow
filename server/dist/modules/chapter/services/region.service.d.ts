import { type AccessActor } from "../../../shared/policies/accessPolicy.service.js";
export interface CreateRegionInput {
    pageId: string;
    regionIndex: number;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    actor: AccessActor;
}
export declare function createRegionService(input: CreateRegionInput): Promise<any>;
export declare function listRegionsService(pageId: string, actor: AccessActor): Promise<any[]>;
export declare function getRegionService(regionId: string, actor: AccessActor): Promise<any>;
export declare function updateRegionStatusService(regionId: string, status: "ACTIVE" | "ARCHIVED", actor: AccessActor): Promise<any>;
export declare function deleteRegionService(regionId: string, actor: AccessActor): Promise<any>;
//# sourceMappingURL=region.service.d.ts.map