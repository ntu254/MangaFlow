import { ExternalLink, MessageSquare, CheckCircle2 } from 'lucide-react'
import type { SeriesSummary } from '@/features/series/services/series.api'

export function ProductionOverviewTab({ summary }: { summary: SeriesSummary }) {
  const currentChapter = summary.currentChapter
  const uploadedPages = summary.chapterSummary.totalPages
  const approvedPages = summary.chapterSummary.approvedPages
  const readiness = summary.chapterSummary.readinessPercent
  const currentChapterPct = currentChapter && currentChapter.pageCount > 0
    ? Math.round((currentChapter.approvedPages / currentChapter.pageCount) * 100)
    : 0
  return (
    <div className="flex flex-col gap-6">

      {/* Publication Readiness Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mt-0 flex items-center gap-6 overflow-x-auto">
        
        <div className="flex flex-col shrink-0 min-w-[140px]">
          <h3 className="text-[15px] font-bold text-gray-900">Publication Readiness</h3>
        </div>

        <div className="h-10 w-px bg-gray-200 shrink-0 mx-2"></div>

        <ReadinessItem icon="file" title="Pages Approved" value={`${approvedPages} / ${uploadedPages}`} />
        <ReadinessItem icon="check" title="All Tasks Approved" value={`${summary.taskSummary.completed} / ${summary.taskSummary.total}`} />
        <ReadinessItem icon="circle" title="Pending Reviews" value={String(summary.taskSummary.pendingReviews)} />
        <ReadinessItem icon="check_circle" title="All Comments Resolved" value={`${summary.commentSummary.resolved} / ${summary.commentSummary.open + summary.commentSummary.resolved}`} />
        
        <div className="flex flex-col shrink-0 ml-4">
          <span className="text-[11px] font-bold text-gray-500 mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Editor Final Approval</span>
          <span className="text-[13px] font-bold text-gray-900">{summary.publicationSummary.isReady ? 'Ready' : 'Pending'}</span>
        </div>

        <div className="flex flex-col shrink-0 ml-4">
          <span className="text-[11px] font-bold text-gray-500 mb-1 flex items-center gap-1"><FileTextIcon /> Publication Date</span>
          <span className="text-[13px] font-bold text-gray-900">{currentChapter?.draftSchedule ? formatDate(currentChapter.draftSchedule) : 'Not scheduled'}</span>
        </div>

        <div className="ml-auto shrink-0 pl-4">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 text-[13px] transition-colors shadow-sm">
            Check Readiness <ArrowRightIcon />
          </button>
        </div>

      </div>

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Production at a Glance */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Chapters</span>
              <span className="text-[16px] font-extrabold text-gray-900">{summary.chapterSummary.total}</span>
              <span className="text-[11px] font-medium text-gray-500">Total</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Pages</span>
              <span className="text-[16px] font-extrabold text-gray-900">{approvedPages} / {uploadedPages}</span>
              <span className="text-[11px] font-medium text-gray-500">Uploaded</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Readiness</span>
              <span className="text-[16px] font-extrabold text-gray-900">{readiness}%</span>
              <span className="text-[11px] font-medium text-gray-500">Series</span>
            </div>
          </div>

          <div className="h-px bg-gray-100 mb-6"></div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Open Tasks</span>
              <span className="text-[16px] font-extrabold text-gray-900">{summary.taskSummary.pending}</span>
              <span className="text-[11px] font-medium text-gray-500">In Progress</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Pending Reviews</span>
              <span className="text-[16px] font-extrabold text-gray-900">{summary.taskSummary.pendingReviews}</span>
              <span className="text-[11px] font-medium text-gray-500">Submissions</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Blocking Comments</span>
              <span className="text-[16px] font-extrabold text-gray-900">{summary.commentSummary.blocking}</span>
              <span className="text-[11px] font-medium text-gray-500">Need Resolve</span>
            </div>
          </div>

          <button className="w-full bg-purple-50 border border-purple-100 hover:bg-purple-100 text-purple-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-[12px] transition-colors mt-auto">
            Go to Production Hub <ExternalLink size={14} />
          </button>
        </div>

        {/* Current Chapter */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
          <h3 className="text-[15px] font-bold text-gray-900 mb-5">Current Chapter</h3>
          
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[20px] font-extrabold text-gray-900">{currentChapter ? `Chapter ${currentChapter.chapterNumber}` : 'No chapter'}</span>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100">{currentChapter ? labelize(currentChapter.status) : '-'}</span>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <div className="flex justify-between items-end">
              <span className="text-[12px] font-bold text-gray-600">Pages {currentChapter?.approvedPages ?? 0} / {currentChapter?.pageCount ?? 0} approved</span>
              <span className="text-[12px] font-bold text-gray-900">{currentChapterPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full" style={{ width: `${currentChapterPct}%` }}></div>
            </div>
          </div>

          <div className="flex justify-between mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Est. Publication</span>
              <span className="text-[13px] font-bold text-gray-900">{currentChapter?.draftSchedule ? formatDate(currentChapter.draftSchedule) : 'Not scheduled'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Chapter Progress</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[13px] font-bold text-emerald-600">{currentChapterPct >= 80 ? 'Good' : 'In Progress'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg text-[12px] transition-colors shadow-sm">
              Open Chapter
            </button>
            <button className="flex-1 bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold py-2 rounded-lg text-[12px] transition-colors shadow-sm">
              Open Page Studio
            </button>
          </div>
        </div>

        {/* Submission Queue */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[15px] font-bold text-gray-900">Submission Queue</h3>
            <button className="text-[12px] font-bold text-purple-600 hover:text-purple-700">View All ({summary.recentSubmissions.length})</button>
          </div>
          
          <div className="flex flex-col gap-4">
            {summary.recentSubmissions.slice(0, 3).map((submission) => (
              <SubmissionItem key={submission.id} chap={String(currentChapter?.chapterNumber ?? '-')} page={`v${submission.version}`} author={submission.submittedBy ?? 'Unknown'} status={labelize(submission.status)} />
            ))}
            {summary.recentSubmissions.length === 0 && <span className="text-[13px] text-gray-400">No submissions yet.</span>}
          </div>
        </div>

        {/* Comment Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[15px] font-bold text-gray-900">Comment Overview</h3>
            <button className="text-[12px] font-bold text-purple-600 hover:text-purple-700">View All</button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <MessageSquare size={14} />
                <span className="text-[13px] font-bold">Total Comments</span>
              </div>
              <span className="text-[14px] font-extrabold text-gray-900">{summary.commentSummary.open + summary.commentSummary.resolved}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="w-5 h-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-[11px] font-bold">{summary.commentSummary.blocking}</span>
                <span className="text-[13px] font-bold">Blocking</span>
              </div>
              <span className="text-[14px] font-extrabold text-gray-900">{summary.commentSummary.blocking}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-[11px] font-bold">{Math.max(0, summary.commentSummary.open - summary.commentSummary.blocking)}</span>
                <span className="text-[13px] font-bold">Needs Fix</span>
              </div>
              <span className="text-[14px] font-extrabold text-gray-900">{Math.max(0, summary.commentSummary.open - summary.commentSummary.blocking)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-[11px] font-bold">{summary.commentSummary.resolved}</span>
                <span className="text-[13px] font-bold">Resolved</span>
              </div>
              <span className="text-[14px] font-extrabold text-gray-900">{summary.commentSummary.resolved}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* Chapter Progress */}
        <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-bold text-gray-900">Chapter Progress</h3>
            <button className="text-[12px] font-bold text-purple-600 hover:text-purple-700">View All Chapters</button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Chapter</th>
                <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Pages</th>
                <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="pb-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary.chapters.slice(0, 5).map((chapter) => (
                <ChapterRow key={chapter.id} ch={String(chapter.chapterNumber)} pages={`${chapter.approvedPages} / ${chapter.pageCount}`} pct={chapter.pageCount > 0 ? Math.round((chapter.approvedPages / chapter.pageCount) * 100) : 0} status={labelize(chapter.status)} date={formatDate(chapter.draftSchedule ?? chapter.updatedAt)} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-bold text-gray-900">Recent Activity</h3>
            <button className="text-[12px] font-bold text-purple-600 hover:text-purple-700">View All</button>
          </div>
          
          <div className="flex flex-col gap-5">
            {summary.recentTasks.slice(0, 3).map((task) => <ActivityItem key={task.id} icon="user" color="purple" title={task.title} desc={`${task.assignee ?? 'Unassigned'} · ${labelize(task.status)}`} time={formatDate(task.dueDate)} />)}
            {summary.recentComments.slice(0, 2).map((comment) => <ActivityItem key={comment.id} icon="msg" color={comment.isBlocking ? 'orange' : 'blue'} title={comment.body} desc={comment.author ?? 'Unknown'} time={formatDate(comment.updatedAt)} />)}
          </div>
        </div>

        {/* Team */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-bold text-gray-900">Team</h3>
            <button className="text-[12px] font-bold text-purple-600 hover:text-purple-700">Manage Team</button>
          </div>

          <div className="flex flex-col gap-4">
            {summary.members.slice(0, 4).map((member) => <TeamMember key={member.id} name={member.user?.name ?? 'Unknown'} role={member.user?.role ?? member.role} badge={member.role} color={member.role === 'MANGAKA' ? 'emerald' : member.role === 'EDITOR' ? 'purple' : 'blue'} />)}
            
            <div className="pt-2">
              <span className="text-[12px] font-medium text-gray-500">+ {Math.max(0, summary.members.length - 4)} more members</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function SubmissionItem({ chap, page, author, status = 'Pending Mangaka Review' }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded bg-gray-200 shrink-0 border border-gray-300"></div>
      <div className="flex flex-col flex-1">
        <span className="text-[13px] font-bold text-gray-900">Chapter {chap} - Page {page}</span>
        <span className="text-[11px] font-medium text-gray-500">By {author}</span>
      </div>
      <div className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-amber-100">
        {status}
      </div>
    </div>
  )
}

function ChapterRow({ ch, pages, pct, status, date }: any) {
  const getStatusColor = (s: string) => {
    if (s === 'In Progress') return 'bg-amber-50 text-amber-600 border-amber-100'
    if (s === 'Editor Approved') return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    if (s === 'Published') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    return 'bg-gray-50 text-gray-600'
  }

  return (
    <tr>
      <td className="py-3">
        <span className="text-[13px] font-bold text-purple-600">Ch. {ch}</span>
      </td>
      <td className="py-3 text-center">
        <span className="text-[12px] font-bold text-gray-600">{pages}</span>
      </td>
      <td className="py-3 pr-6 w-32">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }}></div>
          </div>
          <span className="text-[11px] font-bold text-gray-500 w-8">{pct}%</span>
        </div>
      </td>
      <td className="py-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(status)}`}>
          {status}
        </span>
      </td>
      <td className="py-3 text-right">
        <span className="text-[12px] font-bold text-gray-900">{date}</span>
      </td>
    </tr>
  )
}

function ActivityItem({ icon, color, title, desc, time }: any) {
  return (
    <div className="flex gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-${color}-50 text-${color}-500 border border-${color}-100`}>
        {icon === 'check' && <CheckCircle2 size={12} />}
        {icon === 'user' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        {icon === 'msg' && <MessageSquare size={12} />}
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-bold text-gray-900">{title}</span>
        <span className="text-[12px] font-medium text-gray-500">{desc}</span>
      </div>
      <div className="ml-auto pl-2">
        <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">{time}</span>
      </div>
    </div>
  )
}

function TeamMember({ name, role, badge, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
        <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="" className="w-full h-full object-cover opacity-50" />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[13px] font-bold text-gray-900">{name}</span>
        <span className="text-[11px] font-medium text-gray-500">{role}</span>
      </div>
      <div className={`text-[10px] font-bold bg-${color}-50 text-${color}-600 px-2 py-0.5 rounded border border-${color}-100`}>
        {badge}
      </div>
    </div>
  )
}

function ReadinessItem({ icon, title, value }: any) {
  return (
    <div className="flex flex-col shrink-0 min-w-[130px]">
      <span className="text-[11px] font-bold text-gray-500 mb-1 flex items-center gap-1">
        {icon === 'file' && <FileTextIcon />}
        {icon === 'check' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>}
        {icon === 'circle' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><circle cx="12" cy="12" r="10"/></svg>}
        {icon === 'check_circle' && <CheckCircle2 size={12} className="text-emerald-500" />}
        {title}
      </span>
      <span className="text-[14px] font-extrabold text-gray-900">{value}</span>
    </div>
  )
}

const FileTextIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
const ArrowRightIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>

function labelize(value: string) {
  return value.split('_').join(' ')
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}
