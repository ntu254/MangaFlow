import { MobileApiError } from "@/services/mobile-api-error"
import {
  MobileRequestError,
  describeRequestFailure,
  formatSupportDetails,
  friendlyFailureTitle,
  resolveRequestDiagnostics,
} from "@/services/mobile-request-diagnostics"
import { getMobileInbox } from "@/services/mobile-inbox-data-source"
import { mobileApi } from "@/services/mobile-api-client"

const SECRET_BODY = { secret: "manuscript-page-3", token: "Bearer super-secret" }

describe("mobile request diagnostics", () => {
  afterEach(() => {
    mobileApi.setAccessToken(null)
    mobileApi.setRefreshHandler(null)
    jest.restoreAllMocks()
  })

  it("keeps status, backend code, and request id from an HTTP failure", () => {
    const diagnostics = describeRequestFailure(
      new MobileApiError("Service unavailable.", 503, "SERVICE_UNAVAILABLE", "req-42", SECRET_BODY),
      "Editor work",
    )

    expect(diagnostics).toEqual({
      context: "Editor work",
      category: "HTTP",
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      requestId: "req-42",
    })
  })

  it("categorizes a network failure without a status or request id", () => {
    const diagnostics = describeRequestFailure(new TypeError("Network request failed"), "Editor work")

    expect(diagnostics.category).toBe("NETWORK")
    expect(diagnostics.status).toBeNull()
    expect(diagnostics.code).toBe("NETWORK_UNAVAILABLE")
    expect(diagnostics.requestId).toBeNull()
  })

  it("categorizes a contract failure without echoing the invalid payload", () => {
    const zodError = Object.assign(new Error("Invalid input: expected string"), { name: "ZodError" })
    const diagnostics = describeRequestFailure(zodError, "Editor work")

    expect(diagnostics.category).toBe("CONTRACT")
    expect(diagnostics.code).toBe("CONTRACT_INVALID")
    expect(JSON.stringify(diagnostics)).not.toContain("expected string")
  })

  it("falls back to an unknown category rather than guessing", () => {
    expect(describeRequestFailure({ nope: true }, "Board work").category).toBe("UNKNOWN")
  })

  it("formats support details as safe key/value lines only", () => {
    const details = formatSupportDetails(
      describeRequestFailure(
        new MobileApiError("Nope.", 409, "CONFLICT", "req-9", SECRET_BODY),
        "Editor work",
      ),
    )

    expect(details).toContain("HTTP status: 409")
    expect(details).toContain("Backend code: CONFLICT")
    expect(details).toContain("Request ID: req-9")
    expect(details).not.toContain("manuscript-page-3")
    expect(details).not.toContain("Bearer")
  })

  it("renders missing diagnostic fields as placeholders", () => {
    const details = formatSupportDetails(describeRequestFailure(new TypeError("Failed to fetch"), "Board work"))

    expect(details).toContain("HTTP status: —")
    expect(details).toContain("Request ID: —")
  })

  it("keeps the user-facing title non-technical", () => {
    const title = friendlyFailureTitle(
      describeRequestFailure(new MobileApiError("boom", 500, "INTERNAL", "req-1"), "Editor work"),
    )

    expect(title).toBe("Could not load Editor work.")
    expect(title).not.toMatch(/500|INTERNAL|req-1/)
  })

  it("reuses already-normalized diagnostics instead of re-deriving them", () => {
    const wrapped = new MobileRequestError({
      context: "Editor work",
      category: "HTTP",
      status: 403,
      code: "FORBIDDEN",
      requestId: "req-7",
    })

    expect(resolveRequestDiagnostics(wrapped, "ignored context")).toEqual(wrapped.diagnostics)
  })
})

describe("getMobileInbox failure normalization", () => {
  afterEach(() => {
    mobileApi.setAccessToken(null)
    mobileApi.setRefreshHandler(null)
    jest.restoreAllMocks()
  })

  it("normalizes an HTTP failure with the Editor context", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, code: "SERVICE_UNAVAILABLE", message: "Down." }), {
        status: 503,
        headers: { "x-request-id": "req-99" },
      }),
    ) as unknown as typeof fetch

    await expect(getMobileInbox("editor")).rejects.toMatchObject({
      name: "MobileRequestError",
      diagnostics: {
        context: "Editor work",
        category: "HTTP",
        status: 503,
        code: "SERVICE_UNAVAILABLE",
        requestId: "req-99",
      },
    })
  })

  it("normalizes a contract failure and never returns demo data", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { role: "EDITOR", items: [{ id: 1 }] } }), {
        status: 200,
      }),
    ) as unknown as typeof fetch

    const failure = await getMobileInbox("board").catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(MobileRequestError)
    expect((failure as MobileRequestError).diagnostics).toEqual({
      context: "Board work",
      category: "CONTRACT",
      status: null,
      code: "CONTRACT_INVALID",
      requestId: null,
    })
  })

  it("normalizes a transport failure", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError("Network request failed")) as unknown as typeof fetch

    await expect(getMobileInbox("editor")).rejects.toMatchObject({
      diagnostics: { category: "NETWORK", code: "NETWORK_UNAVAILABLE" },
    })
  })
})
