import { SearchX, Plus } from 'lucide-react'
import { EmptyState } from '@/shared/components/ui/empty-state'

interface SeriesEmptyStateProps {
  isFiltered?: boolean
  onClear?: () => void
  onCreate?: () => void
}

export function SeriesEmptyState({ isFiltered = false, onClear, onCreate }: SeriesEmptyStateProps) {
  return (
    <EmptyState
      icon={SearchX}
      title={isFiltered ? 'No series found' : 'Create your first series'}
      description={isFiltered
        ? "We couldn't find any series matching your current search or filter criteria."
        : 'Start a manga proposal, save it as a draft, and submit it for review when it is ready.'}
      primaryAction={
        isFiltered && onClear ? (
          <button 
            onClick={onClear}
            className="px-5 h-10 bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold text-sm rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            Clear all filters
          </button>
        ) : onCreate ? (
          <button
            onClick={onCreate}
            className="flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            <Plus size={16} />
            Create New Series
          </button>
        ) : undefined
      }
    />
  )
}
