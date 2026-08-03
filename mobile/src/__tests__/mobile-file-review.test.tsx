import { render, screen } from "@testing-library/react-native"
import {
  derivePreviewKind,
  resolveDisplayUrl,
  shouldRefreshLease,
  type FileUrlLease,
} from "@/domain/review-files"
import { getReviewFiles, openReviewFile } from "@/services/mobile-file-review"
import { mobileApi } from "@/services/mobile-api-client"
import { SubmittedFilesPanel } from "@/components/submitted-files-panel"

describe("review-file domain rules", () => {
  it("refreshes a lease 30 seconds before a 900-second URL expires", () => {
    const lease: FileUrlLease = { url: "https://signed.example/file", expiresAtMs: 900_000 }
    expect(shouldRefreshLease(lease, 869_999)).toBe(false)
    expect(shouldRefreshLease(lease, 870_000)).toBe(true)
    expect(shouldRefreshLease(null, 0)).toBe(true)
  })

  it("replaces local absolute display URL origins with the configured Android API origin", () => {
    const androidApiOrigin = "http://10.0.2.2:3001/api"

    expect(
      resolveDisplayUrl("http://localhost:3001/api/files/display/signed-token?download=true#preview", androidApiOrigin),
    ).toBe("http://10.0.2.2:3001/api/files/display/signed-token?download=true#preview")
    expect(resolveDisplayUrl("http://127.0.0.1:3001/api/files/display/signed-token", androidApiOrigin)).toBe(
      "http://10.0.2.2:3001/api/files/display/signed-token",
    )
  })

  it("resolves relative display URLs against the configured API origin", () => {
    expect(resolveDisplayUrl("/api/files/display/signed-token", "http://10.0.2.2:3001/api")).toBe(
      "http://10.0.2.2:3001/api/files/display/signed-token",
    )
  })

  it("leaves remote signed display URLs unchanged", () => {
    expect(resolveDisplayUrl("https://cdn.example/files/signed-token", "http://10.0.2.2:3001/api")).toBe(
      "https://cdn.example/files/signed-token",
    )
  })

  it("classifies preview kind from MIME type", () => {
    expect(derivePreviewKind("image/png")).toBe("image")
    expect(derivePreviewKind("application/pdf")).toBe("pdf")
    expect(derivePreviewKind("application/zip")).toBe("external")
  })
})

describe("mobile-file-review service", () => {
  afterEach(() => {
    mobileApi.setAccessToken(null)
    jest.restoreAllMocks()
  })

  it("lists review files for a context through the live session and derives previewKind", async () => {
    mobileApi.setAccessToken("access-123")
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [{ id: "f1", key: "proposals/p-1/cover.png", name: "cover.png", mimeType: "image/png", size: 100 }],
        }),
        { status: 200 },
      ),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const files = await getReviewFiles("proposal", "p-1")

    expect(files).toEqual([expect.objectContaining({ id: "f1", previewKind: "image" })])
    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/review-files\/proposal\/p-1$/)
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer access-123")
  })

  it("acquires a display URL only when a file is opened, using the server expiry when present", async () => {
    mobileApi.setAccessToken("access-123")
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { url: "/api/files/display/token", expiresAt: new Date(1_000_000).toISOString() },
        }),
        { status: 200 },
      ),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const lease = await openReviewFile({
      id: "f1",
      key: "proposals/p-1/cover.png",
      name: "cover.png",
      mimeType: "image/png",
      size: 100,
      previewKind: "image",
    })

    expect(lease.expiresAtMs).toBe(1_000_000)
    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/files\/display-url$/)
    expect(options.method).toBe("POST")
    expect(JSON.parse(options.body as string)).toMatchObject({
      key: "proposals/p-1/cover.png",
      name: "cover.png",
      fileName: "cover.png",
    })
  })

  it("falls back to an eight-minute in-memory lease when the server omits expiresAt", async () => {
    mobileApi.setAccessToken("access-123")
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { url: "/api/files/display/token" } }), {
        status: 200,
      }),
    ) as unknown as typeof fetch

    const before = Date.now()
    const lease = await openReviewFile({
      id: "f1",
      key: "proposals/p-1/cover.png",
      name: "cover.png",
      mimeType: "image/png",
      size: 100,
      previewKind: "image",
    })

    expect(lease.expiresAtMs).toBeGreaterThanOrEqual(before + 8 * 60 * 1000)
  })
})

describe("SubmittedFilesPanel", () => {
  it("shows an explicit empty state when no files are returned", () => {
    render(<SubmittedFilesPanel files={[]} />)
    expect(screen.getByText("No submitted files are available for this review.")).toBeVisible()
  })

  it("renders file metadata rows", () => {
    render(
      <SubmittedFilesPanel
        files={[
          {
            id: "f1",
            key: "proposals/p-1/cover.png",
            name: "cover.png",
            mimeType: "image/png",
            size: 100,
            submittedBy: "Mangaka Rin",
            previewKind: "image",
          },
        ]}
      />,
    )
    expect(screen.getByText("cover.png")).toBeVisible()
    expect(screen.getByText(/Submitted by Mangaka Rin/)).toBeVisible()
  })
})
