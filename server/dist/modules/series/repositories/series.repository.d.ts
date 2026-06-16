import type { PublicationType, SeriesStatus } from "../../../shared/workflow/status.js";
export type SeriesMemberRole = "MANGAKA" | "ASSISTANT" | "EDITOR";
export interface CreateSeriesInput {
    title: string;
    synopsis: string;
    logline?: string;
    premise?: string;
    characters?: string;
    conflict?: string;
    targetAudience?: string;
    requestedPublicationType?: PublicationType;
    publicationType?: PublicationType;
    tags?: string[];
    genres?: string[];
    ownerId: string;
}
export interface CreateSeriesResult {
    id: string;
    title: string;
    slug: string;
    synopsis: string;
    logline?: string;
    premise?: string;
    characters?: string;
    conflict?: string;
    targetAudience?: string;
    requestedPublicationType?: PublicationType;
    publicationType?: PublicationType;
    tags: string[];
    genres: string[];
    ownerId: string;
    status: SeriesStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BOARD_VISIBLE_STATUSES: SeriesStatus[];
export declare function createSeriesRepository(input: CreateSeriesInput): Promise<CreateSeriesResult>;
export declare function listSeriesForActor(userId: string, role: string): Promise<any[]>;
export declare function getSeriesForActor(seriesId: string, userId: string, role: string): Promise<any | null>;
export declare function getSeriesById(seriesId: string): Promise<any | null>;
export declare function updateSeriesStatus(seriesId: string, status: SeriesStatus): Promise<any | null>;
export interface UpdateSeriesInput {
    title?: string;
    synopsis?: string;
    logline?: string;
    premise?: string;
    characters?: string;
    conflict?: string;
    targetAudience?: string;
    requestedPublicationType?: PublicationType;
    publicationType?: PublicationType;
    tags?: string[];
    genres?: string[];
}
export declare function updateSeriesRepository(seriesId: string, userId: string, input: UpdateSeriesInput): Promise<any>;
//# sourceMappingURL=series.repository.d.ts.map