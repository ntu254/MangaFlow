import { useMemo, useState } from 'react'
import { TaskTypesStatCardsRow } from '@/features/chapters/components/task-types/TaskTypesStatCardsRow'
import {
  TaskTypesTableFilters,
  type TaskTypeSort,
  type TaskTypeStatusFilter,
} from '@/features/chapters/components/task-types/TaskTypesTableFilters'
import { TaskTypesTable } from '@/features/chapters/components/task-types/TaskTypesTable'
import { TaskTypesPagination } from '@/features/chapters/components/task-types/TaskTypesPagination'
import { useAdminTaskTypes } from '@/features/chapters/hooks/useAdminTaskTypes'

const PAGE_SIZE = 10

export default function TaskTypesPage() {
  const { data: taskTypes = [], isLoading, isError } = useAdminTaskTypes()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskTypeStatusFilter>('ALL')
  const [sort, setSort] = useState<TaskTypeSort>('UPDATED_DESC')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredTaskTypes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return taskTypes
      .filter((task) => {
        const matchesSearch = !query || task.name.toLowerCase().includes(query) || task.description.toLowerCase().includes(query)
        const matchesStatus = statusFilter === 'ALL' || task.isActive === (statusFilter === 'ACTIVE')
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sort === 'NAME_ASC') return a.name.localeCompare(b.name)
        if (sort === 'RATE_DESC') return b.baseRate - a.baseRate
        if (sort === 'RATE_ASC') return a.baseRate - b.baseRate
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      })
  }, [taskTypes, searchQuery, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filteredTaskTypes.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const pageItems = filteredTaskTypes.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)
  const resetPage = () => setCurrentPage(1)

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-10'>
      <TaskTypesStatCardsRow />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 flex flex-col">
          <TaskTypesTableFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            sort={sort}
            onSearchChange={(value) => { setSearchQuery(value); resetPage() }}
            onStatusChange={(value) => { setStatusFilter(value); resetPage() }}
            onSortChange={(value) => { setSort(value); resetPage() }}
          />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden mt-2">
            <div className="flex-1 overflow-auto">
              <TaskTypesTable taskTypes={pageItems} isLoading={isLoading} isError={isError} />
            </div>
            {!isLoading && !isError && (
              <TaskTypesPagination currentPage={activePage} totalPages={totalPages} totalItems={filteredTaskTypes.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
