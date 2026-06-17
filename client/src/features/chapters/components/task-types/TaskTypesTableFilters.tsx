import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { CreateTaskTypeDialog } from './CreateTaskTypeDialog'
import { FilterBar } from '@/shared/components/ui/filter-bar'

export type TaskTypeStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
export type TaskTypeSort = 'UPDATED_DESC' | 'NAME_ASC' | 'RATE_DESC' | 'RATE_ASC'

interface TaskTypesTableFiltersProps {
  statusFilter: TaskTypeStatusFilter
  sort: TaskTypeSort
  onSearchChange: (value: string) => void
  onStatusChange: (value: TaskTypeStatusFilter) => void
  onSortChange: (value: TaskTypeSort) => void
}

export function TaskTypesTableFilters({
  statusFilter,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: TaskTypesTableFiltersProps) {
  return (
    <FilterBar
      className="border-0 p-0 bg-transparent"
      onSearchChange={onSearchChange}
      searchPlaceholder="Search task types..."
      actionSlots={<CreateTaskTypeDialog />}
    >
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
    </FilterBar>
  )
}
