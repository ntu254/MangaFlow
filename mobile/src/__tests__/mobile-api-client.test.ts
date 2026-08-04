import { mobileApi } from "@/services/mobile-api-client"
import { MobileApiError } from "@/services/mobile-api-error"

describe("mobile api client", () => {
  afterEach(() => {
    mobileApi.setAccessToken(null)
    mobileApi.setRefreshHandler(null)
    mobileApi.setSessionExpiredHandler(null)
    jest.restoreAllMocks()
  })

  it("preserves backend conflict codes and request ids", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, code: "CONFLICT", message: "This workflow changed." }),
        { status: 409, headers: { "x-request-id": "req-9" } },
      ),
    ) as unknown as typeof fetch

    await expect(mobileApi.request("/editor/inbox")).rejects.toMatchObject({
      name: "MobileApiError",
      status: 409,
      code: "CONFLICT",
      requestId: "req-9",
    })
  })

  it("returns the envelope data on success and sends the bearer token", async () => {
    mobileApi.setAccessToken("access-123")
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { role: "EDITOR", items: [] } }), {
        status: 200,
      }),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const data = await mobileApi.request<{ role: string }>("/editor/inbox")
    expect(data.role).toBe("EDITOR")
    const [, options] = fetchMock.mock.calls[0]
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer access-123")
  })

  it("refreshes once on a 401 and retries", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, code: "UNAUTHENTICATED" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    mobileApi.setRefreshHandler(async () => "renewed-token")

    const data = await mobileApi.request<{ ok: boolean }>("/board/inbox")
    expect(data.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((fetchMock.mock.calls[1][1].headers as Record<string, string>).Authorization).toBe(
      "Bearer renewed-token",
    )
  })

  it("shares one refresh call across concurrent 401s instead of firing one per request", async () => {
    let resolveRefresh!: (token: string) => void
    const refreshPromise = new Promise<string>((resolve) => {
      resolveRefresh = resolve
    })
    const refreshHandler = jest.fn().mockReturnValue(refreshPromise)
    mobileApi.setRefreshHandler(refreshHandler)

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, code: "UNAUTHENTICATED" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, code: "UNAUTHENTICATED" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { source: "a" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { source: "b" } }), { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const requestA = mobileApi.request<{ source: string }>("/editor/inbox")
    const requestB = mobileApi.request<{ source: string }>("/board/inbox")

    // Let both requests reach their 401 branch and call into the shared
    // refresh before the refresh call itself resolves.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    resolveRefresh("renewed-token")

    const [dataA, dataB] = await Promise.all([requestA, requestB])

    expect(dataA.source).toBe("a")
    expect(dataB.source).toBe("b")
    expect(refreshHandler).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it("signs the session out when the refresh handler cannot renew an expired session", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, code: "UNAUTHENTICATED" }), { status: 401 }),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch
    mobileApi.setRefreshHandler(async () => null)
    const onSessionExpired = jest.fn()
    mobileApi.setSessionExpiredHandler(onSessionExpired)

    await expect(mobileApi.request("/editor/inbox")).rejects.toBeInstanceOf(MobileApiError)

    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it("does not throw MobileApiError as generic Error for callers branching on code", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, code: "VALIDATION_ERROR", message: "Bad." }), {
        status: 422,
      }),
    ) as unknown as typeof fetch

    await expect(mobileApi.request("/editor/inbox")).rejects.toBeInstanceOf(MobileApiError)
  })
})
