import { useState } from "react"

interface AIResponse {
  message: string
  newRegions?: any[]
}

export function useAITranslation(pageId?: string) {
  const [detecting, setDetecting] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectBubbles = async () => {
    if (!pageId) return
    setDetecting(true)
    setError(null)
    try {
      const res = await fetch(`/api/pages/${pageId}/ai/bubble-detect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("mf_token")}`,
        },
      })
      if (!res.ok) {
        throw new Error(`Detect failed: ${res.statusText}`)
      }
      const data = await res.json() as AIResponse
      return data
    } catch (err: any) {
      setError(err.message || "Failed to detect bubbles")
      throw err
    } finally {
      setDetecting(false)
    }
  }

  const processBubbles = async () => {
    if (!pageId) return
    setProcessing(true)
    setError(null)
    try {
      const res = await fetch(`/api/pages/${pageId}/ai/bubble-process`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("mf_token")}`,
        },
      })
      if (!res.ok) {
        throw new Error(`Process failed: ${res.statusText}`)
      }
      const data = await res.json() as AIResponse
      return data
    } catch (err: any) {
      setError(err.message || "Failed to process bubbles")
      throw err
    } finally {
      setProcessing(false)
    }
  }

  return {
    detectBubbles,
    processBubbles,
    detecting,
    processing,
    error,
  }
}
