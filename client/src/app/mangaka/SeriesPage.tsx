import { useMemo, useState } from 'react'
import { Plus, Info, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SeriesStatCards } from '@/features/series/components/series-list/SeriesStatCards'
import {
  SeriesViewControls,
  type SeriesSort,
  type SeriesStatusFilter,
} from '@/features/series/components/series-list/SeriesViewControls'
import { SeriesListView } from '@/features/series/components/series-list/SeriesListView'
import { SeriesGridView } from '@/features/series/components/series-list/SeriesGridView'
import { SeriesGridSkeleton } from '@/features/series/components/series-list/SeriesGridSkeleton'
import { SeriesListSkeleton } from '@/features/series/components/series-list/SeriesListSkeleton'
import { SeriesEmptyState } from '@/features/series/components/series-list/SeriesEmptyState'
import { useSeriesList } from '@/features/series/hooks/useSeries'
import { toSeriesViewModel } from '@/features/series/components/series-list/series-view-model'

const SERIES_PER_PAGE = 10

export default function MangakaSeriesPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SeriesStatusFilter>('ALL')
  const [genreFilter, setGenreFilter] = useState('ALL')
  const [sort, setSort] = useState<SeriesSort>('UPDATED_DESC')
  const [currentPage, setCurrentPage] = useState(1)
  const { data, isLoading, isError, refetch, isFetching } = useSeriesList()

  const seriesData = useMemo(() => (data ?? []).map(toSeriesViewModel), [data])
  const draftCount = seriesData.filter((series) => series.status === 'Draft').length
  const genres = useMemo(
    () => [...new Set(seriesData.flatMap((series) => series.genres))].sort((a, b) => a.localeCompare(b)),
    [seriesData],
  )

  const filteredSeries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return seriesData
      .filter((series) => {
        const matchesSearch = !query ||
          series.title.toLowerCase().includes(query) ||
          series.description.toLowerCase().includes(query) ||
          series.genres.some((genre) => genre.toLowerCase().includes(query))
        const matchesStatus = statusFilter === 'ALL' || series.status === statusFilter
        const matchesGenre = genreFilter === 'ALL' || series.genres.includes(genreFilter)
        return matchesSearch && matchesStatus && matchesGenre
      })
      .sort((a, b) => {
        if (sort === 'TITLE_ASC') return a.title.localeCompare(b.title)
        if (sort === 'UPDATED_ASC') return a.updatedAtTimestamp - b.updatedAtTimestamp
        return b.updatedAtTimestamp - a.updatedAtTimestamp
      })
  }, [seriesData, searchQuery, statusFilter, genreFilter, sort])
  const totalPages = Math.max(1, Math.ceil(filteredSeries.length / SERIES_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)
  const pageStart = (activePage - 1) * SERIES_PER_PAGE
  const paginatedSeries = filteredSeries.slice(pageStart, pageStart + SERIES_PER_PAGE)

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setGenreFilter('ALL')
    setSort('UPDATED_DESC')
    setCurrentPage(1)
  }

  return (
    <div className='max-w-[1400px] w-full mx-auto pb-10 space-y-6'>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">My Series</h1>
          <p className="text-[13px] text-slate-500">Create, manage, and track your manga series proposals and active projects.</p>
        </div>
        <button onClick={() => navigate('/app/mangaka/series/create')} className="flex items-center gap-2 bg-indigo-600 text-white h-10 px-5 rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
          <Plus size={18} />
          Create New Series
        </button>
      </div>

      <SeriesStatCards seriesData={seriesData} />

      {/* Unfinished drafts banner */}
      {draftCount > 0 && <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100/80 rounded-lg flex items-center justify-center shrink-0">
             <Info size={16} className="text-amber-600" />
          </div>
          <div className="text-[13px] text-amber-900">
            <span className="font-bold">Unfinished drafts:</span> You have {draftCount} draft {draftCount === 1 ? 'series' : 'series'} that {draftCount === 1 ? "hasn't" : "haven't"} been submitted to the editor.
          </div>
        </div>
        <button
          onClick={() => {
            setStatusFilter((current) => current === 'Draft' ? 'ALL' : 'Draft')
            setCurrentPage(1)
          }}
          className="text-amber-700 font-bold text-[13px] hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded"
        >
          {statusFilter === 'Draft' ? 'View all series' : 'View drafts'} <span className="text-lg leading-none">&rarr;</span>
        </button>
      </div>}
      
      <div className="pt-2">
         <SeriesViewControls 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            genreFilter={genreFilter}
            sort={sort}
            genres={genres}
            hasActiveFilters={searchQuery.trim().length > 0 || statusFilter !== 'ALL' || genreFilter !== 'ALL' || sort !== 'UPDATED_DESC'}
            setSearchQuery={handleSearchChange}
            setStatusFilter={(value) => { setStatusFilter(value); setCurrentPage(1) }}
            setGenreFilter={(value) => { setGenreFilter(value); setCurrentPage(1) }}
            setSort={(value) => { setSort(value); setCurrentPage(1) }}
            onClearFilters={clearFilters}
          />
      </div>

      <div className="pt-2">
        {isLoading ? (
          viewMode === 'grid' ? <SeriesGridSkeleton /> : <SeriesListSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-white px-6 py-20 text-center shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Could not load your series</h3>
              <p className="mt-1 text-sm text-slate-500">Check the API connection and try again.</p>
            </div>
            <button
              onClick={() => void refetch()}
              disabled={isFetching}
              className="flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              Try again
            </button>
          </div>
        ) : filteredSeries.length === 0 ? (
          <SeriesEmptyState
            isFiltered={searchQuery.trim().length > 0 || statusFilter !== 'ALL' || genreFilter !== 'ALL'}
            onCreate={() => navigate('/app/mangaka/series/create')}
            onClear={() => {
              clearFilters()
            }}
          />
        ) : (
          viewMode === 'grid' ? <SeriesGridView seriesData={paginatedSeries} /> : <SeriesListView seriesData={paginatedSeries} />
        )}
      </div>

      {/* Pagination (only show if there's data) */}
      {!isLoading && filteredSeries.length > 0 && (
        <div className="mt-6 flex items-center justify-between pt-2">
          <div className="text-[13px] text-slate-500">
            Showing <span className="font-semibold text-slate-900">{pageStart + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(pageStart + SERIES_PER_PAGE, filteredSeries.length)}</span> of <span className="font-semibold text-slate-900">{filteredSeries.length}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
              className="px-3 py-1.5 text-[13px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              disabled={activePage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-[13px] font-semibold text-white bg-indigo-600 rounded-lg shadow-sm">
              {activePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
              className="px-3 py-1.5 text-[13px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              disabled={activePage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
