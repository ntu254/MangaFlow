import { useMemo, useState } from 'react'
import { UsersStatCardsRow } from '@/features/users/components/users/UsersStatCardsRow'
import {
  UsersTableFilters,
  type UserRoleFilter,
  type UserSort,
  type UserStatusFilter,
} from '@/features/users/components/users/UsersTableFilters'
import { UsersTable } from '@/features/users/components/users/UsersTable'
import { UsersPagination } from '@/features/users/components/users/UsersPagination'
import { useAdminUsers } from '@/features/users/hooks/useAdminUsers'

const PAGE_SIZE = 10

export default function UsersPage() {
  const { data: users = [], isLoading, isError } = useAdminUsers()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('ALL')
  const [sort, setSort] = useState<UserSort>('UPDATED_DESC')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return users
      .filter((user) => {
        const matchesSearch = !query || [user.name, user.email, user.displayName, user.team]
          .some((value) => value?.toLowerCase().includes(query))
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
        const matchesStatus = statusFilter === 'ALL' || user.isActive === (statusFilter === 'ACTIVE')
        return matchesSearch && matchesRole && matchesStatus
      })
      .sort((a, b) => {
        if (sort === 'NAME_ASC') return a.name.localeCompare(b.name)
        if (sort === 'CREATED_DESC') return Date.parse(b.createdAt) - Date.parse(a.createdAt)
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      })
  }, [users, searchQuery, roleFilter, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const pageUsers = filteredUsers.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)
  const resetPage = () => setCurrentPage(1)

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-10'>
      <UsersStatCardsRow />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 flex flex-col">
          <UsersTableFilters
            searchQuery={searchQuery}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            sort={sort}
            onSearchChange={(value) => { setSearchQuery(value); resetPage() }}
            onRoleChange={(value) => { setRoleFilter(value); resetPage() }}
            onStatusChange={(value) => { setStatusFilter(value); resetPage() }}
            onSortChange={(value) => { setSort(value); resetPage() }}
          />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden mt-2">
            <div className="flex-1 overflow-auto">
              <UsersTable users={pageUsers} isLoading={isLoading} isError={isError} />
            </div>
            {!isLoading && !isError && (
              <UsersPagination
                currentPage={activePage}
                totalPages={totalPages}
                totalItems={filteredUsers.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
