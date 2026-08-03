import { getMobileApiBaseUrl } from "@/services/mobile-api-config"
import { MobileApiError } from "@/services/mobile-api-error"

// One in-memory access token for the whole app. Refresh tokens live only in
// secure storage (see mobile-auth-storage). Never log tokens or bodies.
let accessToken: string | null = null
let refreshHandler: (() => Promise<string | null>) | null = null

interface ApiEnvelope<T> {
  success: boolean
  data: T
  code?: string
  message?: string
  details?: unknown
}

async function parse<T>(response: Response): Promise<T> {
  const requestId = response.headers.get("x-request-id") ?? undefined
  let envelope: ApiEnvelope<T> | null = null
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    envelope = null
  }

  if (!response.ok || envelope?.success === false) {
    throw new MobileApiError(
      envelope?.message ?? `Request failed with status ${response.status}.`,
      response.status,
      envelope?.code ?? "UNKNOWN",
      requestId,
      envelope?.details,
    )
  }

  return (envelope as ApiEnvelope<T>).data
}

async function send(path: string, options: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  return fetch(`${getMobileApiBaseUrl()}${path}`, { ...options, headers })
}

export const mobileApi = {
  setAccessToken(token: string | null) {
    accessToken = token
  },
  getAccessToken() {
    return accessToken
  },
  // Restoration wires a one-shot refresh used when a live request sees 401.
  setRefreshHandler(handler: (() => Promise<string | null>) | null) {
    refreshHandler = handler
  },
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response = await send(path, options)
    if (response.status === 401 && refreshHandler) {
      const renewed = await refreshHandler()
      if (renewed) {
        accessToken = renewed
        response = await send(path, options)
      }
    }
    return parse<T>(response)
  },
}
