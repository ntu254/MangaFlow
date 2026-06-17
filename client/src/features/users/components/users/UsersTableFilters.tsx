import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { UserPlus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { FilterBar } from '@/shared/components/ui/filter-bar'

export type UserRoleFilter = 'ALL' | 'ADMIN' | 'MANGAKA' | 'ASSISTANT' | 'EDITOR' | 'BOARD'
export type UserStatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED'
export type UserSort = 'UPDATED_DESC' | 'CREATED_DESC' | 'NAME_ASC'

interface UsersTableFiltersProps {
  roleFilter: UserRoleFilter
  statusFilter: UserStatusFilter
  sort: UserSort
  onSearchChange: (value: string) => void
  onRoleChange: (value: UserRoleFilter) => void
  onStatusChange: (value: UserStatusFilter) => void
  onSortChange: (value: UserSort) => void
}

export function UsersTableFilters({
  roleFilter,
  statusFilter,
  sort,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onSortChange,
}: UsersTableFiltersProps) {
  return (
    <FilterBar
      className="my-4 border-0 p-0 bg-transparent"
      onSearchChange={onSearchChange}
      searchPlaceholder="Search users..."
      actionSlots={
        <Link to="/app/admin/users/create">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-10">
            <UserPlus size={16} /> Create User
          </Button>
        </Link>
      }
    >
      <Select value={roleFilter} onValueChange={(value) => onRoleChange(value as UserRoleFilter)}>
        <SelectTrigger className="h-10 w-[140px] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Roles</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="MANGAKA">Mangaka</SelectItem>
          <SelectItem value="ASSISTANT">Assistant</SelectItem>
          <SelectItem value="EDITOR">Editor</SelectItem>
          <SelectItem value="BOARD">Board</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as UserStatusFilter)}>
        <SelectTrigger className="h-10 w-[140px] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(value) => onSortChange(value as UserSort)}>
        <SelectTrigger className="h-10 w-[160px] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="UPDATED_DESC">Recently Updated</SelectItem>
          <SelectItem value="CREATED_DESC">Newest Created</SelectItem>
          <SelectItem value="NAME_ASC">Name A-Z</SelectItem>
        </SelectContent>
      </Select>
    </FilterBar>
  )
}
