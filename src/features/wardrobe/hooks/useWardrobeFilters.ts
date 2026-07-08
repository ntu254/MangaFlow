import { useMemo } from "react";
import type { ActiveFilters, WardrobeItem } from "../types";

export const defaultWardrobeFilters: ActiveFilters = {
  category: [],
  style: [],
  color: [],
  season: [],
};

interface UseWardrobeFiltersParams {
  items: WardrobeItem[];
  filters: ActiveFilters;
  search: string;
}

export function useWardrobeFilters({ items, filters, search }: UseWardrobeFiltersParams) {
  return useMemo(() => {
    let result = items;

    if (filters.category.length > 0) {
      result = result.filter((item) => filters.category.includes(item.category));
    }

    if (filters.style.length > 0) {
      result = result.filter((item) => item.tags.some((tag) => filters.style.includes(tag)));
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [filters, items, search]);
}
