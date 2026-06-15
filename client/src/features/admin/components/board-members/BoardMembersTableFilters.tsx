import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddBoardMemberDialog } from './AddBoardMemberDialog'

export type BoardStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHAIR'
export type BoardMemberSort = 'UPDATED_DESC' | 'JOINED_DESC' | 'NAME_ASC'

interface BoardMembersTableFiltersProps {
  searchQuery: string
  statusFilter: BoardStatusFilter
  sort: BoardMemberSort
  onSearchChange: (value: string) => void
  onStatusChange: (value: BoardStatusFilter) => void
  onSortChange: (value: BoardMemberSort) => void
}

export function BoardMembersTableFilters({
  searchQuery,
  statusFilter,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: BoardMembersTableFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="relative flex-1 w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search by name or email..."
          className="w-full pl-9 h-10 border-gray-200"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
        <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as BoardStatusFilter)}>
          <SelectTrigger className="h-10 w-[150px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Members</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="CHAIR">Chair</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => onSortChange(value as BoardMemberSort)}>
          <SelectTrigger className="h-10 w-[170px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UPDATED_DESC">Recently Updated</SelectItem>
            <SelectItem value="JOINED_DESC">Newest Joined</SelectItem>
            <SelectItem value="NAME_ASC">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
        <AddBoardMemberDialog />
      </div>
    </div>
  )
}
