import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { Platform } from "react-native"
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
import { pdfPreviewHtml } from "@/components/pdf-preview-html"

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

  it("renders PDF inline on iOS and Android while web uses the external hand-off", () => {
    expect(derivePreviewKind("application/pdf", "ios")).toBe("pdf")
    expect(derivePreviewKind("application/pdf", "android")).toBe("pdf")
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
    expect(JSON.parse(options.body as string)).toEqual({
      key: "proposals/p-1/cover.png",
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

const androidPdfFile: ReviewFile = {
  ...pdfFile,
  previewKind: "pdf",
}

const originalPlatformOS = Platform.OS

describe("ReviewFileViewer", () => {
  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalPlatformOS, configurable: true })
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

  it("reloads a failed PDF preview once, then exposes a private explicit retry", async () => {
    Object.defineProperty(Platform, "OS", { value: "android", configurable: true })
    mobileApi.setAccessToken("access-123")
    const signedUrl = "/api/files/display/private-pdf-token"
    const fetchMock = jest.fn().mockImplementation(() =>
      Promise.resolve(new Response(
        JSON.stringify({
          success: true,
          data: { url: signedUrl, expiresAt: new Date(Date.now() + 60_000).toISOString() },
        }),
        { status: 200 },
      )),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const consoleLog = jest.spyOn(console, "log").mockImplementation(() => undefined)
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined)

    render(<ReviewFileViewer file={androidPdfFile} visible onClose={jest.fn()} />)

    const initialPreview = await screen.findByTestId("pdf-file-preview")
    expect(initialPreview).toHaveProp("source", {
      html: expect.stringContaining(signedUrl),
      baseUrl: "http://10.0.2.2:3001",
    })
    fireEvent(initialPreview, "error")
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const reloadedPreview = await screen.findByTestId("pdf-file-preview")
    fireEvent(reloadedPreview, "error")

    expect(await screen.findByRole("button", { name: "Retry file preview" })).toBeVisible()
    expect(screen.queryByText(signedUrl)).toBeNull()
    expect(consoleLog).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe("pdfPreviewHtml", () => {
  it("bundles PDF.js without sending the signed URL to a remote viewer", () => {
    const signedUrl = "http://10.0.2.2:3001/api/files/display/private-pdf-token"
    const html = pdfPreviewHtml(signedUrl)

    expect(html).toContain(signedUrl)
    expect(html).toContain('connect-src http://10.0.2.2:3001;')
    expect(html).toContain('new DecompressionStream("gzip")')
    expect(html).not.toMatch(/<script[^>]+src=["']https?:/i)
    expect(html).not.toContain("jsdelivr")
  })
})
