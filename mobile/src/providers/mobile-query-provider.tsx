import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type PropsWithChildren } from "react"
import { MobileApiError } from "@/services/mobile-api-error"

// Client errors are deterministic; retrying them wastes time and can double a
// side effect. Only transient network/5xx failures retry, at most twice.
const NON_RETRYABLE = new Set([400, 401, 403, 404, 409, 422, 429])

export function createMobileQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof MobileApiError && NON_RETRYABLE.has(error.status)) return false
          return failureCount < 2
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
