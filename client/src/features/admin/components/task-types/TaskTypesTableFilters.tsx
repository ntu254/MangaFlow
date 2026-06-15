import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateTaskTypeDialog } from './CreateTaskTypeDialog'

export type TaskTypeStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
export type TaskTypeSort = 'UPDATED_DESC' | 'NAME_ASC' | 'RATE_DESC' | 'RATE_ASC'

interface TaskTypesTableFiltersProps {
  searchQuery: string
  statusFilter: TaskTypeStatusFilter
  sort: TaskTypeSort
  onSearchChange: (value: string) => void
  onStatusChange: (value: TaskTypeStatusFilter) => void
  onSortChange: (value: TaskTypeSort) => void
}

export function TaskTypesTableFilters({
  searchQuery,
  statusFilter,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: TaskTypesTableFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="relative flex-1 w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search task types..."
          className="w-full pl-9 h-10 border-gray-200"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
        <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as TaskTypeStatusFilter)}>
          <SelectTrigger className="h-10 w-[140px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => onSortChange(value as TaskTypeSort)}>
          <SelectTrigger className="h-10 w-[170px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UPDATED_DESC">Recently Updated</SelectItem>
            <SelectItem value="NAME_ASC">Name A-Z</SelectItem>
            <SelectItem value="RATE_DESC">Highest Rate</SelectItem>
            <SelectItem value="RATE_ASC">Lowest Rate</SelectItem>
          </SelectContent>
        </Select>
        <CreateTaskTypeDialog />
      </div>
    </div>
  )
}
