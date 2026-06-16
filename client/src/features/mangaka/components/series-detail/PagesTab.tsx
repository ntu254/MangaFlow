import { ArrowRight, ChevronRight, ExternalLink, FileText, MessageCircle, MoreHorizontal, Plus, Settings, UploadCloud } from "lucide-react"
import { useMemo, useState } from "react"
import type { Chapter } from "@/api/chapter"
import { useChapterPages } from "@/hooks/useChapterWorkspace"
import { PageStudio } from "./PageStudio"

interface PagesTabProps {
  seriesId: string
  chapters: Chapter[]
}

export function PagesTab({ seriesId, chapters }: PagesTabProps) {
  const [activeTab, setActiveTab] = useState<"chapter" | "tasks" | "pages" | "submissions" | "comments">("chapter")
  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => b.chapterNumber - a.chapterNumber),
    [chapters],
  )
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>(sortedChapters[0]?.id)
  const selectedChapter = sortedChapters.find((chapter) => chapter.id === selectedChapterId) ?? sortedChapters[0]
  const { data: pages = [], isLoading: pagesLoading } = useChapterPages(selectedChapter?.id)
  const isPagesTab = activeTab === "pages"

  if (!selectedChapter) {
    return <div className="flex h-full items-center justify-center text-gray-500">No production chapters available for series {seriesId}.</div>
  }

  if (isPagesTab) {
    return <PageStudio onBack={() => setActiveTab("chapter")} chapterId={selectedChapter.id} />
  }

  const approvedPages = pages.filter((page) => page.status === "APPROVED").length
  const inProgressPages = pages.filter((page) => ["TASK_ASSIGNED", "IN_PROGRESS", "UNDER_REVIEW"].includes(page.status)).length
  const needsAttentionPages = pages.filter((page) => ["PROCESSING_FAILED"].includes(page.status)).length
  const readyPages = pages.filter((page) => ["UPLOADED"].includes(page.status)).length

  return (
    <div className="flex flex-col w-full h-full gap-6 px-8 py-6 max-w-[1600px] mx-auto">
      {/* Hub Header */}
      <div className="flex flex-col mb-4">
        <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-tight mb-2">Production Hub</h1>
        <p className="text-[14px] text-gray-500 font-medium mb-6">Manage chapters, pages, tasks, and track production progress.</p>

        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-[12px] font-bold border border-emerald-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                {labelizeStatus(selectedChapter.status)}
              </span>
              <span className="text-[14px] font-extrabold text-gray-900">Series {seriesId}</span>
              <span className="text-gray-300">/</span>
              <span className="text-[14px] font-medium text-gray-600">Chapter {selectedChapter.chapterNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Title:</span>
              <span className="text-[13px] font-bold text-gray-900">{selectedChapter.title}</span>
            </div>
          </div>
        </div>

        {/* Hub Sub-tabs */}
        <div className="flex items-center gap-8 pt-4">
          <TabButton icon={<FileText size={16} />} label="Chapter Overview" active={activeTab === "chapter"} onClick={() => setActiveTab("chapter")} />
          <TabButton label="Task Board" active={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} />
          <TabButton label="Page Studio" badge={String(pages.length)} active={isPagesTab} onClick={() => setActiveTab("pages")} />
          <TabButton label="Submissions" badge="0" active={activeTab === "submissions"} onClick={() => setActiveTab("submissions")} />
          <TabButton label="Comments" badge="0" active={activeTab === "comments"} onClick={() => setActiveTab("comments")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-10">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[16px] font-extrabold text-gray-900">Chapters</h2>
            <button className="text-[12px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors">
              <Plus size={14} /> Create Chapter
            </button>
          </div>

          {sortedChapters.map((chapter) => (
            <ChapterCard
              key={chapter.id || (chapter as any)._id}
              ch={chapter.chapterNumber}
              title={chapter.title}
              status={labelizeStatus(chapter.status)}
              pages={chapter.id === selectedChapter.id ? `${pages.length} pages` : "Open to inspect"}
              pct={chapter.id === selectedChapter.id && pages.length ? Math.round((approvedPages / pages.length) * 100) : 0}
              target={chapter.publicationTypeSnapshot ?? "Unknown"}
              tasks=""
              active={chapter.id === selectedChapter.id}
              onClick={() => setSelectedChapterId(chapter.id)}
            />
          ))}

          <button className="text-[13px] font-bold text-purple-600 hover:text-purple-700 mt-2 flex items-center gap-1">
            View all chapters <ArrowRight size={14} />
          </button>
        </div>

        <div className="lg:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-extrabold text-gray-900">Chapter {selectedChapter.chapterNumber}</h2>
              <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded text-[11px] font-bold">{labelizeStatus(selectedChapter.status)}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 text-[12px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                <UploadCloud size={14} /> Upload Page
              </button>
              <button className="flex items-center gap-2 text-[12px] font-bold text-gray-600 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                <Settings size={14} /> Settings
              </button>
              <button onClick={() => setActiveTab("pages")} className="flex items-center gap-2 text-[12px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                Open Chapter Production <ExternalLink size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard label="Pages" value={pagesLoading ? "Loading..." : String(pages.length)} progress={pages.length ? Math.round((approvedPages / pages.length) * 100) : 0} progressColor="bg-purple-500" />
            <MetricCard label="Approved" value={String(approvedPages)} progress={pages.length ? Math.round((approvedPages / pages.length) * 100) : 0} progressColor="bg-emerald-500" />
            <MetricCard label="In Progress" value={String(inProgressPages)} progress={pages.length ? Math.round((inProgressPages / pages.length) * 100) : 0} progressColor="bg-orange-500" />
            <MetricCard label="Needs Attention" value={String(needsAttentionPages + readyPages)} helperText={`Failed: ${needsAttentionPages} · Ready: ${readyPages}`} />
          </div>

          <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
            <button className="font-bold text-[13px] text-purple-600 border-b-2 border-purple-600 pb-3">Pages ({pages.length})</button>
          </div>

          {pagesLoading ? (
            <div className="p-8 text-center text-gray-500">Loading chapter pages...</div>
          ) : pages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pages in this chapter yet.</div>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-4 mb-6">
                {pages.map((page, i) => (
                  <PageCard key={page.id || (page as any)._id || i} num={page.pageNumber} status={labelizeStatus(page.status)} statColor={statusColor(page.status)} onOpen={() => setActiveTab("pages")} />
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <span className="text-[12px] font-medium text-gray-500">Showing {pages.length} page(s)</span>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 border border-gray-200 rounded">
                    <ChevronRight size={14} className="rotate-180" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-purple-600 bg-purple-50 border border-purple-200 rounded font-bold text-[13px]">1</button>
                  <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-900 border border-gray-200 rounded">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
            <div className="flex gap-4 text-[11px] font-medium text-gray-500">
              <span className="flex items-center gap-1.5"><UploadCloud size={12} /> Uploaded assets</span>
              <span className="flex items-center gap-1.5"><MessageCircle size={12} /> Region / AI review</span>
            </div>
            <div className="flex gap-4 text-[11px] font-bold text-gray-600">
              <LegendDot color="bg-emerald-500" label="Approved" />
              <LegendDot color="bg-orange-500" label="In Progress" />
              <LegendDot color="bg-red-500" label="Processing Failed" />
              <LegendDot color="bg-yellow-500" label="Ready / Review" />
              <LegendDot color="bg-gray-300" label="Uploading" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({ icon, label, badge, active, onClick }: { icon?: React.ReactNode; label: string; badge?: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`font-bold text-[14px] border-b-[3px] pb-3 flex items-center gap-2 transition-colors ${active ? "text-purple-600 border-purple-600" : "text-gray-500 hover:text-gray-900 border-transparent"}`}>
      {icon} {label}
      {badge && <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{badge}</div>}
    </button>
  )
}

function ChapterCard({ ch, title, status, pages, pct, target, tasks, active, onClick }: { ch: number; title: string; status: string; pages: string; pct: number; target: string; tasks?: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all relative overflow-hidden text-left ${active ? "border-purple-200 bg-purple-50/30" : "border-gray-200 hover:border-purple-200"}`}>
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[14px] font-extrabold text-gray-900">Ch. {ch}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-100 text-purple-700 border-purple-200">{status}</span>
      </div>
      <div className="text-[12px] font-bold text-gray-800 mb-3 line-clamp-1">{title}</div>
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex justify-between items-end">
          <span className="text-[12px] font-bold text-gray-600">{pages}</span>
          <span className="text-[11px] font-bold text-gray-500">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
        </div>
      </div>
      <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
        <span>{target}</span>
        {tasks && <span className="text-orange-500">{tasks}</span>}
      </div>
    </button>
  )
}

function PageCard({ num, status, statColor, onOpen }: { num: number; status: string; statColor: string; onOpen: () => void }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-red-50 text-red-600 border-red-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
  }

  return (
    <div onClick={onOpen} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col hover:border-purple-300 hover:shadow-md transition-all cursor-pointer relative group text-left">
      <div className="absolute top-4 left-4 w-4 h-4 rounded border border-gray-300 bg-white shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"></div>
      <button type="button" className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal size={14} />
      </button>

      <div className="w-full aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden mb-3 border border-gray-100 relative flex items-center justify-center">
        <FileText size={28} className="text-gray-300" />
      </div>

      <span className="text-[13px] font-extrabold text-gray-900 mb-2">Page {num}</span>
      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit mb-3 ${colors[statColor] ?? colors.gray}`}>{status}</span>

      <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 mt-auto">
        <span className="flex items-center gap-1"><UploadCloud size={12} /> Assets</span>
        <span className="flex items-center gap-1"><MessageCircle size={12} /> Studio</span>
      </div>
    </div>
  )
}

function MetricCard({ label, value, progress, progressColor, helperText }: { label: string; value: string; progress?: number; progressColor?: string; helperText?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-gray-500">{label}</span>
      <span className="text-[16px] font-extrabold text-gray-900">{value}</span>
      {typeof progress === "number" && progressColor ? (
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
          <div className={`${progressColor} h-full rounded-full`} style={{ width: `${progress}%` }}></div>
        </div>
      ) : null}
      {helperText ? <span className="text-[11px] font-medium text-gray-500">{helperText}</span> : null}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${color}`}></div> {label}</span>
}

function labelizeStatus(value: string) {
  return value.split("_").join(" ")
}

function statusColor(status: string) {
  switch (status) {
    case "APPROVED":
      return "emerald"
    case "TASK_ASSIGNED":
    case "IN_PROGRESS":
      return "orange"
    case "PROCESSING_FAILED":
      return "red"
    case "UNDER_REVIEW":
    case "UPLOADED":
      return "yellow"
    default:
      return "gray"
  }
}