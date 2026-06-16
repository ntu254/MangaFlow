import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Play, Send, LayoutPanelLeft, AlertCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useAssistantTaskDetail, useAssistantActions, useAssistantPageAssets } from '@/hooks/useAssistantFlow'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function TaskStudioPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'instructions' | 'comments'>('instructions')
  
  const { data: task, isLoading: isTaskLoading } = useAssistantTaskDetail(taskId)
  const { startTask, submitWork } = useAssistantActions(taskId)

  const { data: pageData, isLoading: isPageLoading } = useAssistantPageAssets(task?.pageId)

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [submitText, setSubmitText] = useState("")

  // Find the target region if this is a region task
  const targetRegion = useMemo(() => {
    if (!task?.regionId || !pageData?.regions) return null
    return pageData.regions.find((r: any) => r.id === task.regionId)
  }, [task?.regionId, pageData?.regions])

  const isLoading = isTaskLoading || isPageLoading

  const handleSubmit = async () => {
    try {
      await submitWork.mutateAsync({ resultText: submitText })
      setIsSubmitDialogOpen(false)
      navigate('/app/assistant/dashboard')
    } catch {
      // hook handles error toast
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center bg-gray-50">
        <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Task not found</h2>
        <Button variant="ghost" onClick={() => navigate('/app/assistant/dashboard')} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Hub
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 bg-gray-50 overflow-hidden">
      
      {/* Left Panel: Task Context */}
      <div className="w-[400px] flex flex-col bg-white border-r border-gray-200 z-10 shrink-0 shadow-sm">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => navigate('/app/assistant/dashboard')} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors mb-3">
            <ArrowLeft size={16} /> Back to Hub
          </button>
          
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider w-fit">Task {taskId?.slice(-6)}</span>
              <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight leading-tight">{task.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4 text-[12px] font-medium text-gray-500">
            <div className="flex items-center gap-1.5"><LayoutPanelLeft size={14} /> Page {pageData?.page.pageNumber || "-"}</div>
            {targetRegion && (
              <div className="flex items-center gap-1.5"><LayoutPanelLeft size={14} /> Region {targetRegion.type}</div>
            )}
            <div className="flex items-center gap-1.5 text-orange-600 font-bold"><Clock size={14} /> Due in 2 hrs</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 border-b border-gray-100 pt-2">
          <button 
            onClick={() => setActiveTab('instructions')}
            className={`pb-3 text-[13px] font-bold px-4 border-b-2 transition-colors ${activeTab === 'instructions' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Instructions
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`pb-3 text-[13px] font-bold px-4 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Comments <span className="bg-gray-100 text-gray-600 px-1.5 rounded-full text-[10px]">2</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'instructions' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Description</h3>
                <p className="text-[14px] text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Reference Materials</h3>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <Play size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-gray-900">Tutorial: Pattern cloning</span>
                    <span className="text-[11px] text-gray-500">Video · 2:15</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">MG</div>
                  <div className="bg-gray-50 p-3 rounded-xl rounded-tl-none border border-gray-100 text-[13px] text-gray-700">
                    Make sure to use the 45-degree angle brush for the screentone reconstruction!
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <input type="text" placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400" />
                <button className="bg-indigo-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shrink-0 hover:bg-indigo-700">
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          {task.status === "TODO" ? (
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-6 rounded-xl"
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-sm border border-gray-200 rounded-xl px-2 py-1.5 flex items-center gap-1 z-10">
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" title="Select Tool">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" title="Zoom In">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          <button className="p-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-[12px] px-3 border border-indigo-100 hover:bg-indigo-100 transition-colors">
            Download Region
          </button>
          <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-[12px] px-3 border border-emerald-100 hover:bg-emerald-100 transition-colors ml-1">
            Upload Result
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div className="relative shadow-2xl rounded-lg overflow-hidden border-4 border-white max-w-full max-h-full">
             {pageData?.page.imageUrl ? (
               <img src={pageData.page.imageUrl} alt="Manga Page Canvas" className="w-full h-full object-contain max-h-[80vh]" />
             ) : (
               <div className="w-[500px] h-[700px] bg-white flex items-center justify-center text-gray-400">No Image Available</div>
             )}
             
             {/* Region Highlight */}
             {targetRegion && (
               <div 
                  className="absolute border-2 border-indigo-500 bg-indigo-500/20"
                  style={{
                    left: `${targetRegion.bbox.x}%`,
                    top: `${targetRegion.bbox.y}%`,
                    width: `${targetRegion.bbox.width}%`,
                    height: `${targetRegion.bbox.height}%`
                  }}
               >
                  <span className="absolute -top-6 left-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
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
          <div className="py-4">
            <Textarea
              placeholder="I removed the raw text and reconstructed the screentone..."
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSubmitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitWork.isPending}>Submit Work</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
