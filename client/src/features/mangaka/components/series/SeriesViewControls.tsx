import { Search, Filter, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SeriesDisplayStatus } from './series-view-model'

export type SeriesStatusFilter = 'ALL' | SeriesDisplayStatus
export type SeriesSort = 'UPDATED_DESC' | 'UPDATED_ASC' | 'TITLE_ASC'

interface SeriesViewControlsProps {
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  searchQuery: string
  statusFilter: SeriesStatusFilter
  genreFilter: string
  sort: SeriesSort
  genres: string[]
  hasActiveFilters: boolean
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: SeriesStatusFilter) => void
  setGenreFilter: (genre: string) => void
  setSort: (sort: SeriesSort) => void
  onClearFilters: () => void
}

const statuses: SeriesDisplayStatus[] = [
  'Draft',
  'Editor Review',
  'Revision Requested',
  'Board Review',
  'Approved',
  'In Production',
  'At Risk',
  'Rejected',
  'Cancelled',
  'Completed',
]

export function SeriesViewControls({
  viewMode,
  setViewMode,
  searchQuery,
  statusFilter,
  genreFilter,
  sort,
  genres,
  hasActiveFilters,
  setSearchQuery,
  setStatusFilter,
  setGenreFilter,
  setSort,
  onClearFilters,
}: SeriesViewControlsProps) {
  return (
    <div className="flex flex-col xl:flex-row items-center justify-between gap-4 w-full py-2">
      <div className="relative w-full xl:w-72 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search title or genre..."
          className="w-full pl-9 h-10 border-gray-200 rounded-lg text-sm bg-white shadow-sm focus-visible:ring-indigo-600"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SeriesStatusFilter)}>
          <SelectTrigger className="h-10 w-[155px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="h-10 w-[145px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Genres</SelectItem>
            {genres.map((genre) => <SelectItem key={genre} value={genre}>{genre}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => setSort(value as SeriesSort)}>
          <SelectTrigger className="h-10 w-[165px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UPDATED_DESC">Recently Updated</SelectItem>
            <SelectItem value="UPDATED_ASC">Oldest Updated</SelectItem>
            <SelectItem value="TITLE_ASC">Title A-Z</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="h-10 gap-2" disabled={!hasActiveFilters} onClick={onClearFilters}>
          <Filter size={16} />
          Clear
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="List View"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
