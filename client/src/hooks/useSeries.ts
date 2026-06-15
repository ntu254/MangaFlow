import { useQuery } from "@tanstack/react-query"
import { seriesApi } from "@/api/series"

export function useSeriesList() {
  return useQuery({
    queryKey: ["series"],
    queryFn: async () => {
      const { data } = await seriesApi.list()
      return data.data
    },
  })
}
export function useSeriesDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["series", id],
    queryFn: async () => {
      if (!id) throw new Error("No series ID")
      const { data } = await seriesApi.get(id)
      return data.data
    },
    enabled: !!id,
  })
}

export function useSeriesSummary(id: string | undefined) {
  return useQuery({
    queryKey: ["series", id, "summary"],
    queryFn: async () => {
      if (!id) throw new Error("No series ID")
      const { data } = await seriesApi.getSummary(id)
      return data.data
    },
    enabled: !!id,
  })
}
