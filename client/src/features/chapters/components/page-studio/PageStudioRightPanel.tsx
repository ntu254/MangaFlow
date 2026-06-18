import { useState } from 'react'
import { MoreVertical, ClipboardList, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { AIResult, Page, Region } from '@/features/chapters/services/chapter.api'
import { AssignTaskModal } from './AssignTaskModal'
import { ReviewActionModal } from './ReviewActionModal'
import { useAuthStore } from '@/features/auth/store/authStore'
import { toast } from 'sonner'
import { useMangakaApprove, useMangakaRequestRevision, useMangakaReject } from '@/features/reviews/hooks/useMangakaReview'
import { useEditorPageApprove, useEditorPageRequestRevision, useEditorPageReject } from '@/features/reviews/hooks/useEditorFlow'

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
  
  const { user } = useAuthStore()
  const isMangaka = user?.role === 'MANGAKA'
  const isEditor = user?.role === 'EDITOR'
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskTarget, setTaskTarget] = useState<{ type: 'page' | 'region', regionId?: string }>({ type: 'page' })

  // Review Actions State
  const [reviewModalState, setReviewModalState] = useState<{
    isOpen: boolean
    actionType: 'approve' | 'revision' | 'reject' | null
  }>({ isOpen: false, actionType: null })

  // Review Actions Hooks
  const mangakaApprove = useMangakaApprove()
  const mangakaRequestRevision = useMangakaRequestRevision()
  const mangakaReject = useMangakaReject()
  const editorApprove = useEditorPageApprove()
  const editorRequestRevision = useEditorPageRequestRevision()
  const editorReject = useEditorPageReject()

  const handleReviewSubmit = async (note: string) => {
    const submissionId = page.activeTask?.currentSubmissionId
    if (!submissionId) {
      toast.error('No submission ID found for this task')
      return
    }

    try {
      if (isMangaka && page.activeTask?.status === 'SUBMITTED') {
        if (reviewModalState.actionType === 'approve') await mangakaApprove.mutateAsync({ submissionId, reviewerNote: note })
        if (reviewModalState.actionType === 'revision') await mangakaRequestRevision.mutateAsync({ submissionId, reviewerNote: note })
        if (reviewModalState.actionType === 'reject') await mangakaReject.mutateAsync({ submissionId, reviewerNote: note })
      } else if (isEditor && page.activeTask?.status === 'MANGAKA_APPROVED') {
        if (reviewModalState.actionType === 'approve') await editorApprove.mutateAsync({ submissionId, reviewerNote: note })
        if (reviewModalState.actionType === 'revision') await editorRequestRevision.mutateAsync({ submissionId, reviewerNote: note })
        if (reviewModalState.actionType === 'reject') await editorReject.mutateAsync({ submissionId, reviewerNote: note })
      }
      toast.success(`Submission ${reviewModalState.actionType} successful!`)
    } catch (err) {
      // Error handled by mutation (or query client), toast here if needed
    } finally {
      setReviewModalState({ isOpen: false, actionType: null })
    }
  }

  const isReviewPending = mangakaApprove.isPending || mangakaRequestRevision.isPending || mangakaReject.isPending || editorApprove.isPending || editorRequestRevision.isPending || editorReject.isPending


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
              
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[12px] font-bold text-slate-900 block mb-2">Task Lock Status</span>
                {page.activeTask?.status === 'IN_PROGRESS' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit font-bold border border-amber-200">
                      Locked: Active Task
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <span className="font-bold">{page.activeTask.assignedTo?.name || 'Assistant'}</span> is currently working on:
                      <br/>"{page.activeTask.taskType?.name || 'Unknown Task'}"
                    </div>
                    <button className="mt-1 w-full flex items-center justify-center py-2 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition-colors shadow-sm">
                      View Active Task
                    </button>
                  </div>
                ) : page.activeTask?.status === 'SUBMITTED' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[12px] text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit font-bold border border-blue-200">
                      Submitted: chờ Mangaka review
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Task: {page.activeTask.taskType?.name || 'Unknown Task'}
                      <br/>
                      By: <span className="font-bold">{page.activeTask.assignedTo?.name || 'Assistant'}</span>
                    </div>
                    {isMangaka && (
                      <div className="flex flex-col gap-2 mt-2">
                        <button 
                          onClick={() => setReviewModalState({ isOpen: true, actionType: 'approve' })}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <CheckCircle size={14} /> Approve Submission
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setReviewModalState({ isOpen: true, actionType: 'revision' })}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-100 text-amber-700 font-bold text-[11px] hover:bg-amber-200 transition-colors"
                          >
                            <AlertCircle size={14} /> Request Revision
                          </button>
                          <button 
                            onClick={() => setReviewModalState({ isOpen: true, actionType: 'reject' })}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-100 text-rose-700 font-bold text-[11px] hover:bg-rose-200 transition-colors"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : page.activeTask?.status === 'TODO' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[12px] text-purple-700 bg-purple-50 px-2 py-1 rounded w-fit font-bold border border-purple-200">
                      Assigned: Not started
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <span className="font-bold">{page.activeTask.assignedTo?.name || 'Assistant'}</span> is assigned to:
                      <br/>"{page.activeTask.taskType?.name || 'Unknown Task'}"
                    </div>
                  </div>
                ) : page.activeTask?.status === 'REVISION_REQUESTED' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[12px] text-rose-700 bg-rose-50 px-2 py-1 rounded w-fit font-bold border border-rose-200">
                      Revision Requested
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Task: {page.activeTask.taskType?.name || 'Unknown Task'}
                      <br/>
                      By: <span className="font-bold">{page.activeTask.assignedTo?.name || 'Assistant'}</span>
                    </div>
                    <div className="mt-2 p-3 bg-rose-50/50 border border-rose-100 rounded-lg">
                      <span className="text-[11px] font-bold text-rose-800 block mb-1">Feedback from {page.activeTask.revisionFeedback?.reviewerRole === 'EDITOR' ? 'Editor' : 'Mangaka'}:</span>
                      {page.activeTask.revisionFeedback?.reviewerNote ? (
                        <p className="text-[11px] text-rose-700 italic">"{page.activeTask.revisionFeedback.reviewerNote}"</p>
                      ) : (
                        <p className="text-[11px] text-rose-700 italic text-muted-foreground">No feedback note available.</p>
                      )}
                    </div>
                    {user?.role === 'ASSISTANT' && (
                      <button className="mt-1 w-full flex items-center justify-center py-2 rounded-lg bg-violet-600 text-white font-bold text-[11px] hover:bg-violet-700 transition-colors shadow-sm">
                        Submit Revision
                      </button>
                    )}
                  </div>
                ) : page.activeTask?.status === 'MANGAKA_APPROVED' ? (
                   <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[12px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit font-bold border border-emerald-200">
                      Waiting Editor Final Review
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Task: {page.activeTask.taskType?.name || 'Unknown Task'}
                    </div>
                    {isEditor && (
                      <div className="flex flex-col gap-2 mt-2">
                        <button 
                          onClick={() => setReviewModalState({ isOpen: true, actionType: 'approve' })}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <CheckCircle size={14} /> Final Approve
                        </button>
                        <button 
                          onClick={() => setReviewModalState({ isOpen: true, actionType: 'revision' })}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-100 text-amber-700 font-bold text-[11px] hover:bg-amber-200 transition-colors"
                        >
                          <AlertCircle size={14} /> Request Revision
                        </button>
                      </div>
                    )}
                  </div>
                ) : (page.status === 'APPROVED' || page.status === 'UPLOADED') ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[12px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit font-bold border border-emerald-200">
                      Ready / Completed
                    </div>
                    <div className="text-[11px] text-slate-500">
                      All tasks completed. Ready for final review.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[12px] text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded w-fit font-bold">
                      Available
                    </div>
                    <button 
                      onClick={handleAssignPageTask}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold text-[12px] transition-colors shadow-sm"
                    >
                      <ClipboardList size={14} />
                      Create New Task
                    </button>
                  </div>
                )}
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

      <AssignTaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        chapterId={page.chapterId} 
        pageId={page.id} 
        regionId={taskTarget.regionId}
        defaultTitle={taskTarget.type === 'page' ? `Task for Page ${page.pageNumber}` : `Task for Region`}
      />

      <ReviewActionModal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState({ isOpen: false, actionType: null })}
        actionType={reviewModalState.actionType}
        onSubmit={handleReviewSubmit}
        isSubmitting={isReviewPending}
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
