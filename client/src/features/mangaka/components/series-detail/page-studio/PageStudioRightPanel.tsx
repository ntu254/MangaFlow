import { useState } from 'react'
import { MoreVertical, ClipboardList } from 'lucide-react'
import type { AIResult, Page, Region } from '@/api/chapter'
import { AssignTaskModal } from './AssignTaskModal'

interface PageStudioRightPanelProps {
  rightTab: 'task' | 'comments'
  setRightTab: (tab: 'task' | 'comments') => void
  page: Page
  regions: Region[]
  aiResults: AIResult[]
  onAcceptSuggestion?: (aiResultId: string, suggestionIndex: number) => void
  onRejectSuggestion?: (aiResultId: string, suggestionIndex: number) => void
  aiActionPending?: boolean
}

export function PageStudioRightPanel({
  rightTab,
  setRightTab,
  page,
  regions,
  aiResults,
  onAcceptSuggestion,
  onRejectSuggestion,
  aiActionPending,
}: PageStudioRightPanelProps) {
  const suggestions = aiResults.flatMap((result) =>
    result.suggestions.map((suggestion) => ({
      ...suggestion,
      aiResultId: result.id,
      aiStatus: result.status,
    })),
  )
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.decision === 'PENDING')
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskTarget, setTaskTarget] = useState<{ type: 'page' | 'region', regionId?: string }>({ type: 'page' })

  const handleAssignPageTask = () => {
    setTaskTarget({ type: 'page' })
    setIsTaskModalOpen(true)
  }

  const handleAssignRegionTask = (regionId: string) => {
    setTaskTarget({ type: 'region', regionId })
    setIsTaskModalOpen(true)
  }

  return (
    <div className="w-80 flex flex-col border-l border-gray-200 shrink-0 bg-white overflow-hidden">
      <div className="flex items-center border-b border-gray-100 shrink-0">
        <button
          type="button"
          onClick={() => setRightTab('task')}
          className={`flex-1 py-4 text-[13px] font-bold border-b-2 transition-colors ${rightTab === 'task' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
        >
          Inspector
        </button>
        <button
          type="button"
          onClick={() => setRightTab('comments')}
          className={`flex-1 py-4 text-[13px] font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${rightTab === 'comments' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
        >
          AI Results
          <span className={`text-[10px] px-1.5 rounded-full ${rightTab === 'comments' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{suggestions.length}</span>
        </button>
      </div>

      {rightTab === 'task' ? (
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 shrink-0">
            <h2 className="text-[15px] font-extrabold text-gray-900">Page {page.pageNumber} details</h2>
            <button type="button" aria-label="More options" className="text-gray-400 hover:text-gray-900">
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-6 text-[13px]">
            <Section title="Page summary">
              <InfoRow label="Status" value={page.status} />
              <InfoRow label="Regions" value={String(regions.length)} />
              <InfoRow label="AI results" value={String(aiResults.length)} />
              <InfoRow label="Pending suggestions" value={String(pendingSuggestions.length)} />
              <div className="mt-2">
                <button 
                  onClick={handleAssignPageTask}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[12px] transition-colors"
                >
                  <ClipboardList size={14} />
                  Assign Page Task
                </button>
              </div>
            </Section>

            <Section title="Regions">
              {regions.length === 0 ? (
                <EmptyText text="No regions created yet. Use Draw Region or AI Detect to begin." />
              ) : (
                <div className="flex flex-col gap-2">
                  {regions.map((region) => (
                    <div key={region.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">Region #{region.regionIndex}</span>
                        <span className="text-[11px] font-bold text-gray-500">{region.type}</span>
                      </div>
                      <div className="mt-2 text-[12px] text-gray-600">{region.status} · {region.source}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">
                          {region.bbox.width}×{region.bbox.height} at ({region.bbox.x}, {region.bbox.y})
                        </span>
                        <button 
                          onClick={() => handleAssignRegionTask(region.id)}
                          className="text-[11px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
                        >
                          Assign Task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 p-5 overflow-y-auto gap-4">
          {aiResults.length === 0 ? (
            <EmptyText text="No AI segmentation results yet." />
          ) : (
            aiResults.map((result) => (
              <div key={result.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-extrabold text-gray-900">AI Result</span>
                  <span className="text-[11px] font-bold text-purple-600">{result.status}</span>
                </div>
                <div className="text-[12px] text-gray-500 mb-3">
                  {result.suggestions.length} suggestions · {new Date(result.createdAt).toLocaleString()}
                </div>
                <div className="flex flex-col gap-2">
                  {result.suggestions.map((suggestion) => (
                    <div key={`${result.id}-${suggestion.suggestionIndex}`} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-gray-900">
                          #{suggestion.suggestionIndex + 1} · {suggestion.type}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">{suggestion.decision}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        {suggestion.bbox.width}×{suggestion.bbox.height} at ({suggestion.bbox.x}, {suggestion.bbox.y})
                      </div>
                      {typeof suggestion.confidence === 'number' ? (
                        <div className="mt-1 text-[11px] text-gray-500">Confidence: {Math.round(suggestion.confidence * 100)}%</div>
                      ) : null}
                      {suggestion.decision === 'PENDING' ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={aiActionPending}
                            onClick={() => onAcceptSuggestion?.(result.id, suggestion.suggestionIndex)}
                            className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-purple-700 disabled:opacity-60"
                          >
                            Accept region
                          </button>
                          <button
                            type="button"
                            disabled={aiActionPending}
                            onClick={() => onRejectSuggestion?.(result.id, suggestion.suggestionIndex)}
                            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      )}

      <AssignTaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        chapterId={page.chapterId} 
        pageId={page.id} 
        regionId={taskTarget.regionId}
        defaultTitle={taskTarget.type === 'page' ? `Task for Page ${page.pageNumber}` : `Task for Region`}
      />
    </div>
  )
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13px] font-extrabold text-gray-900">{title}</span>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] font-bold text-gray-500">{label}</span>
      <span className="text-[12px] font-bold text-gray-900">{value}</span>
    </div>
  )
}

function EmptyText({ text }: { text: string }) {
  return <div className="text-[12px] text-gray-500 border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">{text}</div>
}
