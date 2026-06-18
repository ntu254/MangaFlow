import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Play, Send, LayoutPanelLeft, AlertCircle, Loader2 } from 'lucide-react'
import { useState, useMemo, useRef } from 'react'
import { useAssistantTaskDetail, useAssistantActions, useAssistantPageAssets, useUploadTaskResult } from '@/features/chapters/hooks/useAssistantFlow'
import { usePageImageDownloadUrl } from '@/features/chapters/hooks/useChapterWorkspace'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { usePageChrome } from '@/shared/components/layout/page-chrome'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { useAuthStore } from '@/features/auth/store/authStore'

export default function TaskStudioPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'instructions' | 'comments'>('instructions')

  // Full-screen focused task studio.
  usePageChrome({ sidebar: 'hidden', bleed: true })
  
  const { data: task, isLoading: isTaskLoading, isError: isTaskError } = useAssistantTaskDetail(taskId)
  const { startTask, submitWork } = useAssistantActions(taskId)
  const uploadTaskResult = useUploadTaskResult(taskId)

  const { data: pageData, isLoading: isPageLoading, isError: isPageError } = useAssistantPageAssets(task?.pageId)

  // Fetch download URL of the page working file asset
  const fileAssetId = pageData?.workingFileAsset?.id || 
    (typeof pageData?.page?.workingFileAssetId === 'object' 
      ? (pageData.page.workingFileAssetId as any)?._id 
      : pageData?.page?.workingFileAssetId)
  const { data: downloadData } = usePageImageDownloadUrl(fileAssetId)
  const imageUrl = downloadData?.downloadUrl

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [submitText, setSubmitText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Find the target region if this is a region task
  const targetRegion = useMemo(() => {
    if (!task?.regionId || !pageData?.regions) return null
    return pageData.regions.find((r: any) => r.id === task.regionId)
  }, [task?.regionId, pageData?.regions])

  const isLoading = isTaskLoading || isPageLoading

  const handleSubmit = async () => {
    try {
      let finalAssetId = uploadedAssetId;
      if (selectedFile && !uploadedAssetId) {
        finalAssetId = await uploadTaskResult.mutateAsync({ file: selectedFile })
      }
      
      await submitWork.mutateAsync({ resultText: submitText, fileAssetId: finalAssetId || undefined })
      setIsSubmitDialogOpen(false)
      navigate('/app/assistant/dashboard')
    } catch {
      // hook handles error toast
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <span className="text-sm font-medium">Loading workspace...</span>
      </div>
    )
  }

  if (!task || isTaskError || isPageError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <EmptyState 
            icon={AlertCircle}
            title="Task not found"
            description="The task you are looking for does not exist or you don't have permission to view it."
            className="bg-white border-slate-200"
          />
        </div>
        <Button variant="ghost" onClick={() => navigate('/app/assistant/dashboard')} className="mt-6 gap-2 text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to Hub
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">

      {/* Left Panel: Task Context */}
      <div className="w-[400px] flex flex-col bg-white border-r border-slate-200 z-10 shrink-0 shadow-sm">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <button onClick={() => navigate('/app/assistant/dashboard')} className="flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors mb-3">
            <ArrowLeft size={16} /> Back to Hub
          </button>
          
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-wider w-fit">Task {taskId?.slice(-6)}</span>
              <h1 className="text-[20px] font-extrabold text-slate-900 tracking-tight leading-tight">{task.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4 text-[12px] font-medium text-slate-500">
            <div className="flex items-center gap-1.5"><LayoutPanelLeft size={14} /> Page {pageData?.page.pageNumber || "-"}</div>
            {targetRegion && (
              <div className="flex items-center gap-1.5"><LayoutPanelLeft size={14} /> Region {targetRegion.type}</div>
            )}
            <div className="flex items-center gap-1.5 text-amber-600 font-bold"><Clock size={14} /> Due in 2 hrs</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 border-b border-slate-100 pt-2">
          <button 
            onClick={() => setActiveTab('instructions')}
            className={`pb-3 text-[13px] font-bold px-4 border-b-2 transition-colors ${activeTab === 'instructions' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            Instructions
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`pb-3 text-[13px] font-bold px-4 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'comments' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            Comments <span className="bg-gray-100 text-gray-600 px-1.5 rounded-full text-[10px]">2</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'instructions' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Description</h3>
                <p className="text-[14px] text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Reference Materials</h3>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600 group-hover:bg-violet-100 transition-colors">
                    <Play size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-900">Tutorial: Pattern cloning</span>
                    <span className="text-[11px] text-slate-500">Video · 2:15</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">MG</div>
                  <div className="bg-slate-50 p-3 rounded-xl rounded-tl-none border border-slate-100 text-[13px] text-slate-700">
                    Make sure to use the 45-degree angle brush for the screentone reconstruction!
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <input type="text" placeholder="Type a message..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-violet-400" />
                <button className="bg-violet-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shrink-0 hover:bg-violet-700">
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          {user?._id !== task.assignedTo ? (
            <div className="bg-slate-100 text-slate-500 rounded-xl py-4 text-center font-bold text-sm border border-slate-200">
              Not Assignee
            </div>
          ) : task.status === "TODO" ? (
            <Button 
              className="w-full bg-violet-600 hover:bg-violet-700 font-bold py-6 rounded-xl"
              onClick={() => startTask.mutate()}
              disabled={startTask.isPending}
            >
              Start Task
            </Button>
          ) : (
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold py-6 rounded-xl"
              onClick={() => setIsSubmitDialogOpen(true)}
              disabled={submitWork.isPending || task.status === "SUBMITTED" || task.status === "MANGAKA_APPROVED" || task.status === "EDITOR_APPROVED"}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" /> Submit for Review
            </Button>
          )}
        </div>
      </div>

      {/* Right Panel: Canvas Area */}
      <div className="flex-1 flex flex-col relative bg-slate-100">
        
        {/* Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-xl px-2 py-1.5 flex items-center gap-1 z-10">
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" title="Select Tool">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" title="Zoom In">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
          </button>
          <button 
            className="p-2 bg-violet-50 text-violet-600 rounded-lg font-bold text-[12px] px-3 border border-violet-100 hover:bg-violet-100 transition-colors"
            onClick={() => {
              if (imageUrl) {
                const a = document.createElement('a')
                a.href = imageUrl
                a.download = `page_${pageData?.page?.pageNumber || 'download'}.png`
                a.click()
              }
            }}
          >
            Download Region
          </button>
          <button 
            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-[12px] px-3 border border-emerald-100 hover:bg-emerald-100 transition-colors ml-1"
            onClick={() => setIsSubmitDialogOpen(true)}
            disabled={task.status !== "IN_PROGRESS" && task.status !== "REVISION_REQUESTED"}
          >
            Upload Result
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div className="relative shadow-2xl rounded-lg overflow-hidden border-4 border-white max-w-full max-h-full">
             {imageUrl ? (
               <img src={imageUrl} alt="Manga Page Canvas" className="w-full h-full object-contain max-h-[80vh]" />
             ) : (
               <div className="w-[500px] h-[700px] bg-white flex items-center justify-center text-gray-400">No Image Available</div>
             )}
             
             {/* Region Highlight */}
             {targetRegion && (
               <div 
                  className="absolute border-2 border-violet-500 bg-violet-500/20"
                  style={{
                    left: `${targetRegion.bbox.x}%`,
                    top: `${targetRegion.bbox.y}%`,
                    width: `${targetRegion.bbox.width}%`,
                    height: `${targetRegion.bbox.height}%`
                  }}
               >
                  <span className="absolute -top-6 left-0 bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                    Target Region: {targetRegion.type}
                  </span>
               </div>
             )}
          </div>
        </div>

      </div>

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Work</DialogTitle>
            <DialogDescription>
              Submit your work for Mangaka review. You can add an optional note describing your changes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* File Upload Area */}
            <div 
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setSelectedFile(file)
                    setUploadedAssetId(null) // reset if they pick a new file
                  }
                }} 
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="text-sm font-bold text-slate-700">{selectedFile.name}</div>
                  <div className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                    <AlertCircle size={24} />
                  </div>
                  <div className="text-sm font-bold text-slate-700 mb-1">Click to upload result image</div>
                  <div className="text-xs text-slate-500">PNG, JPG or WEBP (max. 100MB)</div>
                </>
              )}
            </div>

            <Textarea
              placeholder="I removed the raw text and reconstructed the screentone..."
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSubmitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitWork.isPending || uploadTaskResult.isPending}>
              {(submitWork.isPending || uploadTaskResult.isPending) ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                "Submit Work"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
