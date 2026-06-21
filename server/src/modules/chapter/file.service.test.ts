import { describe, expect, it, vi } from "vitest"
import { isValidObjectId } from "mongoose"
import { createPresignedUploadUrl } from "./file.service.js"

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://uploads.example.test/page"),
}))

describe("createPresignedUploadUrl", () => {
  it("returns a Mongo ObjectId-compatible fileAssetId", async () => {
    const result = await createPresignedUploadUrl("page.jpg", "image/jpeg")

    expect(isValidObjectId(result.fileAssetId)).toBe(true)
    expect(result.r2Key).toBe(`uploads/${result.fileAssetId}.jpg`)
  })

  it("stores chapter page images under series/chapter/image folders when scoped", async () => {
    const result = await createPresignedUploadUrl(
      "Page 01.PNG",
      "image/png",
      3600,
      undefined,
      {
        seriesId: "series-1",
        chapterId: "chapter-2",
      },
    )

    expect(result.r2Key).toBe(
      `series/series-1/chapters/chapter-2/images/${result.fileAssetId}.png`,
    )
  })
})
