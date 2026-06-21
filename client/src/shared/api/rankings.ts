import { api, unwrap } from "./_client";

export type RankingStatus = "DRAFT" | "SUBMITTED" | "FINALIZED" | "VOIDED";

export interface RankingItem {
  id?: string;
  _id?: string;
  period: string;
  seriesId:
    | string
    | {
        id?: string;
        _id?: string;
        title?: string;
        slug?: string;
        status?: string;
      };
  voteCount: number;
  readerScore: number;
  finalScore: number;
  status: RankingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportRankingInput {
  period: string;
  seriesId: string;
  voteCount: number;
  readerScore: number;
}

export const rankingsApi = {
  list: () => api.get("/rankings").then(unwrap<RankingItem[]>),
  import: (body: ImportRankingInput) =>
    api.post("/rankings/import", body).then(unwrap<RankingItem>),
  submit: (rankingId: string) =>
    api.post(`/rankings/${rankingId}/submit`).then(unwrap<RankingItem>),
  finalize: (rankingId: string) =>
    api.post(`/rankings/${rankingId}/finalize`).then(unwrap<RankingItem>),
  void: (rankingId: string) => api.post(`/rankings/${rankingId}/void`).then(unwrap<RankingItem>),
};
