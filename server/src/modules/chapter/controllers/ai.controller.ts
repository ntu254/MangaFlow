import { type Request, type Response, type RequestHandler } from "express"
import { Page, FileAsset, Region } from "../chapter.model.js"
import { getFileBuffer, uploadBuffer } from "../file.service.js"
import { config } from "../../../shared/utils/env.js"

const AI_SERVICE_URL = "http://127.0.0.1:8000"

interface AIBubbleResponse {
  bubble_count: number
  bubbles: Array<{
    id: number
    bbox: { x: number; y: number; width: number; height: number }
    confidence: number
    has_mask: boolean
  }>
  image_mime_type?: string
  image_base64?: string
}

async function appendDetectedRegions(pageId: string, bubbles: AIBubbleResponse["bubbles"]) {
  const existingRegions = await Region.find({ pageId }).sort("-regionIndex").limit(1)
  let regionIndex = existingRegions.length > 0 ? existingRegions[0].regionIndex + 1 : 1
  const newRegions = []

  for (const bubble of bubbles) {
    const region = new Region({
      pageId,
      regionIndex: regionIndex++,
      bbox: {
        x: Math.round(bubble.bbox.x),
        y: Math.round(bubble.bbox.y),
        width: Math.round(bubble.bbox.width),
        height: Math.round(bubble.bbox.height),
      },
      status: "ACTIVE",
    })
    await region.save()
    newRegions.push(region)
  }

  await Page.findByIdAndUpdate(String(pageId), { $addToSet: { regionIds: { $each: newRegions.map((r) => r._id) } } })
  return newRegions
}

export const detectBubbles: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params

    const page = await Page.findById(pageId)
    if (!page || !page.originalFileAssetId) {
      res.status(404).json({ success: false, message: "Page or original file not found" })
      return
    }

    const fileAsset = await FileAsset.findById(page.originalFileAssetId)
    if (!fileAsset) {
      res.status(404).json({ success: false, message: "File asset not found" })
      return
    }

    const buffer = await getFileBuffer(fileAsset.r2Key)
    const formData = new FormData()
    formData.append("file", new Blob([buffer], { type: fileAsset.mimeType }), fileAsset.originalName)

    const response = await fetch(`${AI_SERVICE_URL}/bubble/detect`, { method: "POST", body: formData })
    if (!response.ok) throw new Error(`AI service responded with ${response.status}`)

    const data = (await response.json()) as AIBubbleResponse
    const newRegions = await appendDetectedRegions(String(pageId), data.bubbles)

    res.json({ success: true, message: "Detection completed", data: { bubbleCount: data.bubble_count, newRegions } })
  } catch (error) {
    console.error("AI Detect Error:", error)
    res.status(500).json({ success: false, message: "Failed to detect bubbles via AI" })
  }
}

export const processBubbles: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params

    const page = await Page.findById(pageId)
    if (!page || !page.originalFileAssetId) {
      res.status(404).json({ success: false, message: "Page or original file not found" })
      return
    }

    const fileAsset = await FileAsset.findById(page.originalFileAssetId)
    if (!fileAsset) {
      res.status(404).json({ success: false, message: "File asset not found" })
      return
    }

    const buffer = await getFileBuffer(fileAsset.r2Key)
    const formData = new FormData()
    formData.append("file", new Blob([buffer], { type: fileAsset.mimeType }), fileAsset.originalName)

    const response = await fetch(`${AI_SERVICE_URL}/bubble/process`, { method: "POST", body: formData })
    if (!response.ok) throw new Error(`AI service responded with ${response.status}`)

    const data = (await response.json()) as AIBubbleResponse
    const newRegions = await appendDetectedRegions(String(pageId), data.bubbles)

    const result: { bubbleCount: number; newRegions: unknown[]; variantFileAssetId?: string } = {
      bubbleCount: data.bubble_count,
      newRegions,
    }

    if (data.image_base64 && data.image_mime_type) {
      const imgBuffer = Buffer.from(data.image_base64, "base64")
      const originalName = fileAsset.originalName.replace(/\.[^/.]+$/, "") + "_whitened.png"
      const { fileAssetId, r2Key, size } = await uploadBuffer(imgBuffer, originalName, data.image_mime_type)

      const variantFileAsset = new FileAsset({
        _id: fileAssetId,
        originalName,
        mimeType: data.image_mime_type,
        size,
        r2Key,
        r2Bucket: config.r2Bucket,
        uploadedBy: req.user!.userId,
      })

      await variantFileAsset.save()
      await Page.findByIdAndUpdate(String(pageId), { $addToSet: { variantFileAssetIds: variantFileAsset._id } })
      result.variantFileAssetId = String(variantFileAsset._id)
    }

    res.json({ success: true, message: "Processing completed", data: result })
  } catch (error) {
    console.error("AI Process Error:", error)
    res.status(500).json({ success: false, message: "Failed to process bubbles via AI" })
  }
}

