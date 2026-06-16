import { type AccessActor } from "../../../shared/policies/accessPolicy.service.js";
export interface CreateRegionInput {
    pageId: string;
    type: string;
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
export interface UpdateRegionInput {
    type?: string;
    bbox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    actor: AccessActor;
}
export declare function updateRegionService(regionId: string, input: UpdateRegionInput): Promise<any>;
export declare function deleteRegionService(regionId: string, actor: AccessActor): Promise<any>;
//# sourceMappingURL=region.service.d.ts.map