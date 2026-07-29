import { apiRequest } from "./client";

export type RateTableStatus = "ACTIVE" | "INACTIVE";

export type RateTableEntry = {
  id: string;
  code: string;
  label: string;
  workUnitType: string;
  amount: number;
  currency: string;
  version: number;
  status: RateTableStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateRateTableRequest = {
  code: string;
  label: string;
  workUnitType: string;
  amount: number;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
};

export type PatchRateTableRequest = {
  label?: string;
  status?: RateTableStatus;
  effectiveTo?: string | null;
};

export const rateTableApi = {
  active: () => apiRequest("/rates/active"),
  list: () => apiRequest("/admin/rates"),
  create: (body: CreateRateTableRequest) => apiRequest("/admin/rates", { method: "POST", body }),
  patch: (id: string, body: PatchRateTableRequest) =>
    apiRequest(`/admin/rates/${id}`, { method: "PATCH", body }),
};
