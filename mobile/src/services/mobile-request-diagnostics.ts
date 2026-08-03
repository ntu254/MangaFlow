import { ZodError } from "zod"
import { MobileApiError } from "@/services/mobile-api-error"

// Safe, support-facing description of a failed read. Everything here is either
// a transport fact (status), a backend business code, or a correlation id —
// never a response body, bearer token, or stack trace.
export type MobileFailureCategory = "HTTP" | "NETWORK" | "CONTRACT" | "UNKNOWN"

export interface MobileRequestDiagnostics {
  /** Role/context noun used by the friendly title, e.g. "Editor work". */
  context: string
  category: MobileFailureCategory
  status: number | null
  code: string | null
  requestId: string | null
}

// Thrown by data sources that own a user-visible error surface, so screens get
// the normalized diagnostics instead of re-parsing whatever the layer below hit.
export class MobileRequestError extends Error {
  constructor(readonly diagnostics: MobileRequestDiagnostics) {
    super(friendlyFailureTitle(diagnostics))
    this.name = "MobileRequestError"
  }
}

function isZodError(error: unknown): boolean {
  // Name check as well as instanceof: a duplicated zod instance in the bundle
  // would otherwise be misreported as an unknown failure.
  return error instanceof ZodError || (error instanceof Error && error.name === "ZodError")
}

function isNetworkError(error: unknown): boolean {
  // React Native surfaces an offline/DNS/TLS failure from fetch as a TypeError.
  return (
    error instanceof TypeError ||
    (error instanceof Error && /network request failed|failed to fetch/i.test(error.message))
  )
}

export function describeRequestFailure(error: unknown, context: string): MobileRequestDiagnostics {
  if (error instanceof MobileApiError) {
    return {
      context,
      category: "HTTP",
      status: error.status,
      code: error.code,
      requestId: error.requestId ?? null,
    }
  }

  if (isZodError(error)) {
    // The payload itself stays out of diagnostics — only the fact that the
    // response did not match the shared contract.
    return { context, category: "CONTRACT", status: null, code: "CONTRACT_INVALID", requestId: null }
  }

  if (isNetworkError(error)) {
    return { context, category: "NETWORK", status: null, code: "NETWORK_UNAVAILABLE", requestId: null }
  }

  return { context, category: "UNKNOWN", status: null, code: null, requestId: null }
}

// Screens receive either an already-normalized failure or a raw one from a data
// source that has not been migrated yet.
export function resolveRequestDiagnostics(
  error: unknown,
  context: string,
): MobileRequestDiagnostics {
  if (error instanceof MobileRequestError) return error.diagnostics
  return describeRequestFailure(error, context)
}

export function friendlyFailureTitle(diagnostics: MobileRequestDiagnostics): string {
  return `Could not load ${diagnostics.context}.`
}

export function formatSupportDetails(diagnostics: MobileRequestDiagnostics): string {
  return [
    `Context: ${diagnostics.context}`,
    `Category: ${diagnostics.category}`,
    `HTTP status: ${diagnostics.status ?? "—"}`,
    `Backend code: ${diagnostics.code ?? "—"}`,
    `Request ID: ${diagnostics.requestId ?? "—"}`,
  ].join("\n")
}
