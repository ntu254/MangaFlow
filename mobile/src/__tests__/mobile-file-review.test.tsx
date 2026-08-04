import { render, screen, waitFor } from "@testing-library/react-native"
import {
  derivePreviewKind,
  resolveDisplayUrl,
  shouldRefreshLease,
  type FileUrlLease,
  type ReviewFile,
} from "@/domain/review-files"
import { getReviewFiles, openReviewFile } from "@/services/mobile-file-review"
import { mobileApi } from "@/services/mobile-api-client"
import { SubmittedFilesPanel } from "@/components/submitted-files-panel"
import { ReviewFileViewer } from "@/components/review-file-viewer"

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

  it("classifies image and unknown MIME types the same on every platform", () => {
    expect(derivePreviewKind("image/png", "ios")).toBe("image")
    expect(derivePreviewKind("image/png", "android")).toBe("image")
    expect(derivePreviewKind("application/zip", "ios")).toBe("external")
    expect(derivePreviewKind("application/zip", "android")).toBe("external")
  })

  it("renders PDF inline only on iOS; Android and web route to the external hand-off", () => {
    expect(derivePreviewKind("application/pdf", "ios")).toBe("pdf")
    expect(derivePreviewKind("application/pdf", "android")).toBe("external")
    expect(derivePreviewKind("application/pdf", "web")).toBe("external")
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

function mockDisplayUrlResponse(expiresAtMs: number) {
  return new Response(
    JSON.stringify({ success: true, data: { url: "/api/files/display/token", expiresAt: new Date(expiresAtMs).toISOString() } }),
    { status: 200 },
  )
}

const pdfFile: ReviewFile = {
  id: "f-pdf",
  key: "proposals/p-1/manuscript.pdf",
  name: "manuscript.pdf",
  mimeType: "application/pdf",
  size: 1000,
  previewKind: "external",
}

const zipFile: ReviewFile = {
  id: "f-zip",
  key: "proposals/p-1/archive.zip",
  name: "archive.zip",
  mimeType: "application/zip",
  size: 1000,
  previewKind: "external",
}

describe("ReviewFileViewer", () => {
  afterEach(() => {
    mobileApi.setAccessToken(null)
    jest.restoreAllMocks()
  })

  it("clears the lease and closes the viewer on 403", async () => {
    mobileApi.setAccessToken("access-123")
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: "Forbidden", code: "FORBIDDEN" }), { status: 403 }),
    ) as unknown as typeof fetch
    const onClose = jest.fn()

    render(<ReviewFileViewer file={pdfFile} visible onClose={onClose} />)

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it("explains the platform limitation for a PDF routed to the external hand-off", async () => {
    mobileApi.setAccessToken("access-123")
    globalThis.fetch = jest.fn().mockResolvedValue(mockDisplayUrlResponse(Date.now() + 60_000)) as unknown as typeof fetch

    render(<ReviewFileViewer file={pdfFile} visible onClose={jest.fn()} />)

    expect(
      await screen.findByText("PDF preview is unavailable in this build. Open it in your device PDF reader instead."),
    ).toBeVisible()
  })

  it("shows the generic unsupported-type message for a non-PDF external file", async () => {
    mobileApi.setAccessToken("access-123")
    globalThis.fetch = jest.fn().mockResolvedValue(mockDisplayUrlResponse(Date.now() + 60_000)) as unknown as typeof fetch

    render(<ReviewFileViewer file={zipFile} visible onClose={jest.fn()} />)

    expect(await screen.findByText("This file type is not previewed inside MangaFlow.")).toBeVisible()
  })

  it("proactively refreshes the lease 30 seconds before it expires, without waiting for a failure", async () => {
    jest.useFakeTimers()
    mobileApi.setAccessToken("access-123")
    const fetchMock = jest.fn().mockResolvedValue(mockDisplayUrlResponse(Date.now() + 60_000))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    render(<ReviewFileViewer file={pdfFile} visible onClose={jest.fn()} />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    jest.advanceTimersByTime(30_000)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    jest.useRealTimers()
  })
})
