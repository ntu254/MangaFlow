import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { UserPlus, Search } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

export type UserRoleFilter = 'ALL' | 'ADMIN' | 'MANGAKA' | 'ASSISTANT' | 'EDITOR' | 'BOARD'
export type UserStatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED'
export type UserSort = 'UPDATED_DESC' | 'CREATED_DESC' | 'NAME_ASC'

interface UsersTableFiltersProps {
  searchQuery: string
  roleFilter: UserRoleFilter
  statusFilter: UserStatusFilter
  sort: UserSort
  onSearchChange: (value: string) => void
  onRoleChange: (value: UserRoleFilter) => void
  onStatusChange: (value: UserStatusFilter) => void
  onSortChange: (value: UserSort) => void
}

export function UsersTableFilters({
  searchQuery,
  roleFilter,
  statusFilter,
  sort,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onSortChange,
}: UsersTableFiltersProps) {
  return (
    <div className="flex flex-col xl:flex-row items-center justify-between gap-4 py-4">
      <div className="relative flex-1 w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search by name, email, or team..."
          className="w-full pl-9 h-10 border-gray-200"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 w-full xl:w-auto flex-wrap">
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

        <Link to="/app/admin/users/create">
          <Button className="h-10 bg-purple-600 hover:bg-purple-700 text-white gap-2">
            <UserPlus size={16} /> Create User
          </Button>
        </Link>
      </div>
    </div>
  )
}
