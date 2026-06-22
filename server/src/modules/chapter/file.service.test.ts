import { describe, expect, it, vi } from "vitest"
import { isValidObjectId } from "mongoose"
import { createPresignedUploadUrl } from "./file.service.js"

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://uploads.example.test/page"),
}))

describe("createPresignedUploadUrl", () => {
  it("throws an error if customR2Key is missing", async () => {
    await expect(createPresignedUploadUrl("page.jpg", "image/jpeg")).rejects.toThrow(
      "r2Key is required for createPresignedUploadUrl. Please generate it using pathBuilder."
    )
  })

  it("returns a Mongo ObjectId-compatible fileAssetId and the provided customR2Key", async () => {
    const customKey = "prod/tenant_main/series/series-1/chapters/chapter-2/pages/page-3/original/v1/page.jpg"
    const result = await createPresignedUploadUrl("page.jpg", "image/jpeg", 3600, customKey)

    expect(isValidObjectId(result.fileAssetId)).toBe(true)
    expect(result.r2Key).toBe(customKey)
  })
})
