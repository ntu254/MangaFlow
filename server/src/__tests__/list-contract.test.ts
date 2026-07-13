import type { AuthedRequest } from "../types.js";
import {
  buildListEnvelope,
  combineMongoFilters,
  listFiltersToMongo,
  listSearchToMongo,
  listSortToMongo,
  parseListQuery,
} from "../shared/contracts/index.js";

function req(query: AuthedRequest["query"]): AuthedRequest {
  return { query } as AuthedRequest;
}

describe("shared list contract", () => {
  it("parses pagination, search, sort, and typed filters", () => {
    const filters = {
      status: { type: "select", value: ["READY", "PUBLISHED"] },
      title: { type: "text", value: "Berserk" },
      atRisk: { type: "boolean", value: true },
    };

    const query = parseListQuery(
      req({
        page: "2",
        pageSize: "50",
        q: "chapter",
        sortBy: "createdAt",
        sortDir: "desc",
        filters: JSON.stringify(filters),
      }),
      {
        sortable: ["createdAt"],
        filterable: {
          status: "select",
          title: "text",
          atRisk: "boolean",
        },
      },
    );

    expect(query).toEqual({
      page: 2,
      pageSize: 50,
      q: "chapter",
      sort: { field: "createdAt", dir: "desc" },
      filters,
    });
  });

  it("rejects unknown sort and filter fields", () => {
    expect(() => parseListQuery(req({ sortBy: "actions" }), { sortable: ["title"] })).toThrow(
      "Cannot sort by actions",
    );

    expect(() =>
      parseListQuery(req({ filters: JSON.stringify({ ownerId: { type: "text", value: "x" } }) }), {
        filterable: { title: "text" },
      }),
    ).toThrow("Cannot filter by ownerId");
  });

  it("builds mongo fragments and response envelopes", () => {
    expect(listSortToMongo({ field: "createdAt", dir: "desc" })).toEqual({ createdAt: -1 });
    expect(listSearchToMongo("a.b", ["title", "summary"])).toEqual({
      $or: [{ title: /a\.b/i }, { summary: /a\.b/i }],
    });
    expect(
      listFiltersToMongo({
        title: { type: "text", value: "Guts" },
        rank: { type: "numberRange", min: 1, max: 10 },
        atRisk: { type: "boolean", value: false },
      }),
    ).toEqual({
      title: /Guts/i,
      rank: { $gte: 1, $lte: 10 },
      atRisk: false,
    });
    expect(combineMongoFilters({ authorId: "u1" }, { status: "READY" })).toEqual({
      $and: [{ authorId: "u1" }, { status: "READY" }],
    });

    expect(
      buildListEnvelope([{ id: "1" }], { page: 2, pageSize: 10, filters: {}, q: "x" }, 25),
    ).toEqual({
      data: [{ id: "1" }],
      pagination: {
        page: 2,
        pageSize: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      },
      meta: {
        q: "x",
        sort: undefined,
        filters: {},
      },
    });
  });
});
