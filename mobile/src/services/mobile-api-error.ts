// Normalized error for every mobile API failure. Preserves the backend
// business `code`, HTTP `status`, and `x-request-id` so screens can branch on
// conflict/permission/validation without re-parsing envelopes.
export class MobileApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = "MobileApiError"
  }
}
