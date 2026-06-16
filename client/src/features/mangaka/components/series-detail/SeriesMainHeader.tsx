import { Info, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import type { SeriesSummary } from '@/api/series'

interface SeriesMainHeaderProps {
  summary: SeriesSummary
  seriesPhase?: 'proposal' | 'production'
}

export function SeriesMainHeader({ summary, seriesPhase = 'proposal' }: SeriesMainHeaderProps) {
  const isProposal = seriesPhase === 'proposal';
  const chapterCount = summary.chapterSummary.total
  const pageCount = summary.chapterSummary.totalPages
  const currentChapter = summary.currentChapter

  const steps = [
    { id: 1, name: 'Draft', status: 'completed' },
    { id: 2, name: 'Submitted', status: 'completed' },
    { id: 3, name: 'Editor Review', status: isProposal ? 'current' : 'completed' },
    { id: 4, name: 'Board Review', status: isProposal ? 'upcoming' : 'completed' },
    { id: 5, name: 'Approved', status: isProposal ? 'upcoming' : 'completed' },
    { id: 6, name: 'Ongoing', status: isProposal ? 'upcoming' : 'current' },
  ];

  return (
    <div className="flex flex-col gap-6 mb-8 w-full">
      {/* Back Button & Breadcrumb */}
      <div className="flex flex-col gap-3">
        <button className="flex items-center gap-2 text-[13px] font-bold text-gray-600 hover:text-gray-900 transition-colors w-fit">
          <ArrowLeft size={14} /> Back to My Series
        </button>
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Series Detail</span>
      </div>

      {/* Main Header Content */}
      <div className="flex flex-col lg:flex-row gap-8 justify-between items-start">
        
        {/* Left Side: Title & Info Grid */}
        <div className="flex flex-col flex-1 gap-4">
          
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">{summary.series.title}</h1>
            <div className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
              isProposal ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              {isProposal ? labelize(summary.series.status) : `${labelize(summary.series.status)} Production`}
            </div>
            <Info size={16} className="text-gray-400" />
          </div>

          <p className="text-[14px] text-gray-600 font-medium">{summary.series.synopsis}</p>

          <div className="grid grid-cols-3 xl:grid-cols-6 gap-y-4 gap-x-8 mt-2 max-w-4xl">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Owner</span>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700">{summary.owner?.name?.charAt(0).toUpperCase() ?? '?'}</span>
                <span className="text-[13px] font-bold text-gray-900">{summary.owner?.name ?? 'Unknown'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">{isProposal ? 'Submitted' : 'Publication'}</span>
              <span className="text-[13px] font-bold text-gray-900">{isProposal ? formatDate(summary.currentManuscript?.createdAt ?? summary.series.createdAt) : (summary.series.publicationType || '-')}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">Target Audience</span>
              <span className="text-[13px] font-bold text-gray-900">{summary.series.targetAudience || '-'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">{isProposal ? 'Proposed Type' : 'Total Chapters'}</span>
              <span className="text-[13px] font-bold text-gray-900">{isProposal ? (summary.series.requestedPublicationType || '-') : chapterCount}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">{isProposal ? 'Total Chapters' : 'Total Pages'}</span>
              <span className="text-[13px] font-bold text-gray-900">{isProposal ? chapterCount : pageCount}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-500">{isProposal ? 'Total Pages' : 'Created'}</span>
              <span className="text-[13px] font-bold text-gray-900">{isProposal ? pageCount : formatDate(summary.series.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Stepper & Next Action */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Lifecycle Stepper */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center relative w-[360px]">
              <div className="absolute left-4 right-4 top-3 h-[2px] bg-gray-200"></div>
              <div className="absolute left-4 top-3 h-[2px] bg-emerald-500 transition-all duration-500" style={{ width: isProposal ? '40%' : '100%' }}></div>
              
              <div className="flex justify-between w-full relative z-10">
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center gap-2 group">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 bg-white transition-colors ${
                      step.status === 'completed' ? 'border-emerald-500 bg-emerald-500 text-white' : 
                      step.status === 'current' ? 'border-purple-600 ring-4 ring-purple-100 text-purple-600' : 
                      'border-gray-200 text-gray-300'
                    }`}>
                      {step.status === 'completed' ? <CheckCircle2 size={14} strokeWidth={3} className="text-white" /> : (step.status === 'current' ? <div className="w-2 h-2 rounded-full bg-purple-600" /> : <div className="w-2 h-2 rounded-full bg-gray-200" />)}
                    </div>
                    <span className={`text-[10px] text-center font-bold absolute top-8 w-16 -ml-5.5 ${
                      step.status === 'current' ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[12px] font-bold text-gray-500 mt-6 flex items-center gap-1.5">
              Current Phase: <span className={isProposal ? "text-orange-500" : "text-emerald-500"}>{isProposal ? 'Editor Review' : 'Production'}</span>
            </div>
            
            {/* Context Alert Banner */}
            <div className={`mt-2 border rounded-xl p-3 flex gap-3 items-start shadow-sm ${isProposal ? 'bg-purple-50 border-purple-100' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className={`bg-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isProposal ? 'text-purple-600' : 'text-indigo-600'}`}>
                <Info size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-gray-900">{isProposal ? `This series is in ${labelize(summary.series.status)}` : 'You are viewing the production overview.'}</span>
                <span className="text-[11px] font-medium text-gray-600 mt-0.5">{isProposal ? (summary.commentSummary.open > 0 ? 'The editor has feedback for your proposal.' : 'The editor is reviewing your proposal.') : 'This shows real-time production status and progress.'}</span>
              </div>
            </div>
            
          </div>

          {/* Next Action Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 w-[240px] flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">{isProposal ? 'Next Action' : 'Next Milestone'}</h3>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-gray-900">
                {isProposal ? `Your manuscript is ${labelize(summary.currentManuscript?.status ?? summary.series.status).toLowerCase()}.` : (currentChapter ? `Chapter ${currentChapter.chapterNumber} ${labelize(currentChapter.status)}` : 'No active chapter')}
              </span>
              {!isProposal && (
                <span className="text-[11px] text-gray-500 font-medium mt-1">Due: {currentChapter?.draftSchedule ? formatDate(currentChapter.draftSchedule) : 'Not scheduled'}</span>
              )}
            </div>
            <button className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-[12px] mt-1 border border-purple-100 shadow-sm">
              {isProposal ? 'View Submission' : 'Open Workspace'} <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}

function labelize(value: string) {
  return value.split('_').join(' ')
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}
