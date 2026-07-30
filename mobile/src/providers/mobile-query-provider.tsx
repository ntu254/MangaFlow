import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type PropsWithChildren } from "react"
import { MobileApiError } from "@/services/mobile-api-error"

export function createMobileQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Only transient failures retry (network error or 5xx), at most twice.
        // Deterministic failures never retry: 4xx business errors, and contract
        // (Zod) or programming errors would just fail again and can waste calls.
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false
          if (error instanceof MobileApiError) return error.status >= 500
          if (error instanceof Error && error.name === "ZodError") return false
          // A non-typed throw here is almost always a fetch/network failure.
          return true
        },
      },
      mutations: { retry: 0 },
    },
  })
}

export function MobileQueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(createMobileQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
