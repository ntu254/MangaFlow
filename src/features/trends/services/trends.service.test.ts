import { describe, it, expect, vi, beforeEach } from "vitest";

const trendsMock = [
  {
    title: "Tối giản tinh tế",
    description: "Phong cách tối giản",
    growth_pct: 12,
    season: "all_year",
    category: "Casual",
  },
  {
    title: "Layer công sở",
    description: "Lớp layer văn phòng",
    growth_pct: 8,
    season: "autumn",
    category: "Office",
  },
];

const regionalResponse = [
  {
    region: "Hà Nội",
    trends: ["Tối giản tinh tế", "Layer công sở", "Streetwear"],
  },
  {
    region: "TP. HCM",
    trends: ["Tối giản tinh tế", "Summer vibe"],
  },
  {
    region: "Đà Nẵng",
    trends: ["Layer công sở", "Beach style"],
  },
];

const nextResponse = [
  { name: "Quiet Luxury", confidence: 90 },
  { name: "Smart Casual", confidence: 85 },
];

vi.mock("@/shared/api/config", () => ({
  apiConfig: { useMockApi: true },
}));

vi.mock("@/shared/api", () => ({
  apiClient: {
    get: vi.fn().mockImplementation((path: string) => {
      if (path.startsWith("/api/trends/regional")) return Promise.resolve(regionalResponse);
      if (path.startsWith("/api/trends/next")) return Promise.resolve(nextResponse);
      return Promise.resolve(trendsMock);
    }),
  },
}));

import { trendsService } from "./trends.service";

describe("trends.service", () => {
  it("getSeasonalTrends returns grouped trend data", async () => {
    const data = await trendsService.getSeasonalTrends();
    expect(Array.isArray(data)).toBe(true);
  });

  it("getRegionalTrends returns cities like Hà Nội, TP. HCM, Đà Nẵng", async () => {
    const data = await trendsService.getRegionalTrends();
    const regions = data.map((item: { region: string }) => item.region);
    expect(regions).toEqual(expect.arrayContaining(["Hà Nội", "TP. HCM", "Đà Nẵng"]));
  });

  it("getNextTrends returns next trend candidates", async () => {
    const data = await trendsService.getNextTrends();
    expect(Array.isArray(data)).toBe(true);
  });
});
