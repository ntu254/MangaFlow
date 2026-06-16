import { Plus, SearchX } from 'lucide-react'

interface SeriesEmptyStateProps {
  isFiltered?: boolean
  onClear?: () => void
  onCreate?: () => void
}

export function SeriesEmptyState({ isFiltered = false, onClear, onCreate }: SeriesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white border border-slate-200 rounded-2xl shadow-sm w-full">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
        <SearchX size={32} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{isFiltered ? 'No series found' : 'Create your first series'}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {isFiltered
          ? "We couldn't find any series matching your current search or filter criteria."
          : 'Start a manga proposal, save it as a draft, and submit it for review when it is ready.'}
      </p>
      {isFiltered && onClear ? (
        <button 
          onClick={onClear}
          className="px-5 h-10 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-sm rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          Clear all filters
        </button>
      ) : onCreate ? (
        <button
          onClick={onCreate}
          className="flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <Plus size={16} />
          Create New Series
        </button>
      ) : null}
    </div>
  )
}
