import { useMemo, useState } from 'react'
import { BoardStatCardsRow } from '@/features/admin/components/board-members/BoardStatCardsRow'
import {
  BoardMembersTableFilters,
  type BoardMemberSort,
  type BoardStatusFilter,
} from '@/features/admin/components/board-members/BoardMembersTableFilters'
import { BoardMembersTable } from '@/features/admin/components/board-members/BoardMembersTable'
import { BoardMembersPagination } from '@/features/admin/components/board-members/BoardMembersPagination'
import { useAdminBoardMembers } from '@/hooks/useAdmin'

const PAGE_SIZE = 10

export default function BoardMembersPage() {
  const { data: members = [], isLoading, isError } = useAdminBoardMembers()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<BoardStatusFilter>('ALL')
  const [sort, setSort] = useState<BoardMemberSort>('UPDATED_DESC')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return members
      .filter((member) => {
        const matchesSearch = !query || member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)
        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'ACTIVE' && member.isActive) ||
          (statusFilter === 'INACTIVE' && !member.isActive) ||
          (statusFilter === 'CHAIR' && member.isChair)
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sort === 'NAME_ASC') return a.name.localeCompare(b.name)
        if (sort === 'JOINED_DESC') return Date.parse(b.createdAt) - Date.parse(a.createdAt)
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      })
  }, [members, searchQuery, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const pageItems = filteredMembers.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)
  const resetPage = () => setCurrentPage(1)

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-10'>
      <BoardStatCardsRow />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 flex flex-col">
          <BoardMembersTableFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            sort={sort}
            onSearchChange={(value) => { setSearchQuery(value); resetPage() }}
            onStatusChange={(value) => { setStatusFilter(value); resetPage() }}
            onSortChange={(value) => { setSort(value); resetPage() }}
          />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden mt-2">
            <div className="flex-1 overflow-auto">
              <BoardMembersTable members={pageItems} isLoading={isLoading} isError={isError} />
            </div>
            {!isLoading && !isError && (
              <BoardMembersPagination currentPage={activePage} totalPages={totalPages} totalItems={filteredMembers.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
