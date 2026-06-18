import { useMemo, useRef, useState } from 'react'
import type { AIResult, Region } from '@/features/chapters/services/chapter.api'

interface PageStudioCanvasProps {
  imageUrl?: string
  regions: Region[]
  aiResults: AIResult[]
  drawMode: boolean
  onDrawRegion: (bbox: { x: number; y: number; width: number; height: number }) => void
}

const REGION_COLORS: Record<string, string> = {
  PANEL: 'border-emerald-500 bg-emerald-500/10',
  BUBBLE: 'border-purple-500 bg-purple-500/10',
  SFX: 'border-amber-500 bg-amber-500/10',
  AREA: 'border-blue-500 bg-blue-500/10',
  OTHER: 'border-gray-500 bg-gray-500/10',
}

export function PageStudioCanvas({ imageUrl, regions, aiResults, drawMode, onDrawRegion }: PageStudioCanvasProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const pendingSuggestions = useMemo(
    () =>
      aiResults
        .filter((r) => r.status === 'COMPLETED' || r.status === 'PARTIALLY_ACCEPTED')
        .flatMap((r) => r.suggestions.filter((s) => s.decision === 'PENDING')),
    [aiResults],
  )

  function toImageCoords(clientX: number, clientY: number) {
    const el = imgRef.current
    if (!el || !natural) return null
    const rect = el.getBoundingClientRect()
    const scaleX = natural.w / rect.width
    const scaleY = natural.h / rect.height
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!drawMode) return
    const pt = toImageCoords(e.clientX, e.clientY)
    if (!pt) return
    startRef.current = pt
    setDraft({ x: pt.x, y: pt.y, w: 0, h: 0 })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drawMode || !startRef.current) return
    const pt = toImageCoords(e.clientX, e.clientY)
    if (!pt) return
    const start = startRef.current
    setDraft({
      x: Math.min(start.x, pt.x),
      y: Math.min(start.y, pt.y),
      w: Math.abs(pt.x - start.x),
      h: Math.abs(pt.y - start.y),
    })
  }

  function handleMouseUp() {
    if (!drawMode || !draft || !startRef.current) return
    startRef.current = null
    if (draft.w > 4 && draft.h > 4) {
      onDrawRegion({ x: draft.x, y: draft.y, width: draft.w, height: draft.h })
    }
    setDraft(null)
  }

  function pct(value: number, total: number) {
    return total > 0 ? `${(value / total) * 100}%` : '0%'
  }

  if (!imageUrl) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-[13px] font-medium">
        Working image is not available for this page.
      </div>
    )
  }


  return (
    <div className="flex-1 relative overflow-auto p-8 flex justify-center items-start">
      <div
        className={`relative shadow-sm border border-gray-200 bg-white ${drawMode ? 'cursor-crosshair' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Working page"
          className="max-w-[640px] w-auto h-auto block select-none"
          draggable={false}
          onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        />

        {natural &&
          regions.map((region) => (
            <div
              key={region.id}
              className={`absolute border-2 rounded group ${REGION_COLORS[region.type] ?? REGION_COLORS.OTHER} ${region.source === 'AI' ? 'border-dashed' : ''}`}
              style={{
                left: pct(region.bbox.x, natural.w),
                top: pct(region.bbox.y, natural.h),
                width: pct(region.bbox.width, natural.w),
                height: pct(region.bbox.height, natural.h),
              }}
            >
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-gray-900 text-white rounded text-[11px] font-bold flex items-center justify-center shadow-sm">
                {region.regionIndex}
              </div>
            </div>
          ))}

        {natural &&
          pendingSuggestions.map((s) => (
            <div
              key={`sugg-${s.suggestionIndex}`}
              className="absolute border-2 border-dashed border-pink-500 bg-pink-500/10 rounded"
              style={{
                left: pct(s.bbox.x, natural.w),
                top: pct(s.bbox.y, natural.h),
                width: pct(s.bbox.width, natural.w),
                height: pct(s.bbox.height, natural.h),
              }}
            >
              <div className="absolute -top-3 -left-3 px-1 h-5 bg-pink-500 text-white rounded text-[10px] font-bold flex items-center justify-center shadow-sm">
                AI
              </div>
            </div>
          ))}

        {natural && draft && (
          <div
            className="absolute border-2 border-purple-600 bg-purple-600/10 rounded"
            style={{
              left: pct(draft.x, natural.w),
              top: pct(draft.y, natural.h),
              width: pct(draft.w, natural.w),
              height: pct(draft.h, natural.h),
            }}
          />
        )}
      </div>
    </div>
  )
}
