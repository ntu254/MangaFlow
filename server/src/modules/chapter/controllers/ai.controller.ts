import { type Request, type Response, type RequestHandler } from "express"
import { Page, FileAsset, Region } from "../chapter.model.js"
import { getFileBuffer, uploadBuffer } from "../file.service.js"
import { config } from "../../../shared/utils/env.js"

const AI_SERVICE_URL = "http://127.0.0.1:8000" // Hardcoded per MVP requirements

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

export const detectBubbles: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params

    const page = await Page.findById(pageId)
    if (!page || !page.originalFileAssetId) {
      res.status(404).json({ error: "Page or original file not found" })
      return
    }

    const fileAsset = await FileAsset.findById(page.originalFileAssetId)
    if (!fileAsset) {
      res.status(404).json({ error: "File asset not found" })
      return
    }

    // Download from R2
    const buffer = await getFileBuffer(fileAsset.r2Key)

    // Send to AI service
    const formData = new FormData()
    const blob = new Blob([buffer], { type: fileAsset.mimeType })
    formData.append("file", blob, fileAsset.originalName)

    const response = await fetch(`${AI_SERVICE_URL}/bubble/detect`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`)
    }

    const data = (await response.json()) as AIBubbleResponse

    // Map bubbles to Regions
    const newRegions = []
    let regionIndex = 1
    
    // Determine the highest existing regionIndex
    const existingRegions = await Region.find({ pageId }).sort("-regionIndex").limit(1)
    if (existingRegions.length > 0) {
      regionIndex = existingRegions[0].regionIndex + 1
    }

    for (const b of data.bubbles) {
      const region = new Region({
        pageId,
        regionIndex: regionIndex++,
        bbox: {
          x: Math.round(b.bbox.x),
          y: Math.round(b.bbox.y),
          width: Math.round(b.bbox.width),
          height: Math.round(b.bbox.height),
        },
        status: "ACTIVE",
      })
      await region.save()
      newRegions.push(region)
      page.regionIds.push(region._id)
    }

    await page.save()

    res.json({ message: "Detection completed", newRegions })
  } catch (error) {
    console.error("AI Detect Error:", error)
    res.status(500).json({ error: "Failed to detect bubbles via AI" })
  }
}

export const processBubbles: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params

    const page = await Page.findById(pageId)
    if (!page || !page.originalFileAssetId) {
      res.status(404).json({ error: "Page or original file not found" })
      return
    }

    const fileAsset = await FileAsset.findById(page.originalFileAssetId)
    if (!fileAsset) {
      res.status(404).json({ error: "File asset not found" })
      return
    }

    // Download from R2
    const buffer = await getFileBuffer(fileAsset.r2Key)

    // Send to AI service
    const formData = new FormData()
    const blob = new Blob([buffer], { type: fileAsset.mimeType })
    formData.append("file", blob, fileAsset.originalName)

    const response = await fetch(`${AI_SERVICE_URL}/bubble/process`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`)
    }

    const data = (await response.json()) as AIBubbleResponse

    // Create regions
    const newRegions = []
    let regionIndex = 1
    const existingRegions = await Region.find({ pageId }).sort("-regionIndex").limit(1)
    if (existingRegions.length > 0) {
      regionIndex = existingRegions[0].regionIndex + 1
    }

    for (const b of data.bubbles) {
      const region = new Region({
        pageId,
        regionIndex: regionIndex++,
        bbox: {
          x: Math.round(b.bbox.x),
          y: Math.round(b.bbox.y),
          width: Math.round(b.bbox.width),
          height: Math.round(b.bbox.height),
        },
        status: "ACTIVE",
      })
      await region.save()
      newRegions.push(region)
      page.regionIds.push(region._id)
    }

    // Process whitened image
    if (data.image_base64 && data.image_mime_type) {
      const imgBuffer = Buffer.from(data.image_base64, "base64")
      
      // Upload to R2
      const originalName = fileAsset.originalName.replace(/\.[^/.]+$/, "") + "_whitened.png"
      
      const { fileAssetId, r2Key, size } = await uploadBuffer(
        imgBuffer,
        originalName,
        data.image_mime_type
      )

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
      page.variantFileAssetIds = page.variantFileAssetIds || []
      page.variantFileAssetIds.push(variantFileAsset._id)
    }

    await page.save()

    res.json({ message: "Processing completed", newRegions })
  } catch (error) {
    console.error("AI Process Error:", error)
    res.status(500).json({ error: "Failed to process bubbles via AI" })
  }
}
