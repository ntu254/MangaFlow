import { useMemo, useState } from 'react'
import { TaskTypesStatCardsRow } from '@/features/chapters/components/task-types/TaskTypesStatCardsRow'
import {
  TaskTypesTableFilters,
  type TaskTypeSort,
  type TaskTypeStatusFilter,
} from '@/features/chapters/components/task-types/TaskTypesTableFilters'
import { useAdminTaskTypes } from '@/features/chapters/hooks/useAdminTaskTypes'
import { PageHeader } from '@/shared/components/ui/page-header'
import { ConfigCard } from '@/features/admin/components/ConfigCard'
import { DangerZone } from '@/shared/components/ui/danger-zone'

export default function TaskTypesPage() {
  const { data: taskTypes = [], isLoading, isError } = useAdminTaskTypes()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskTypeStatusFilter>('ALL')
  const [sort, setSort] = useState<TaskTypeSort>('UPDATED_DESC')

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

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-10'>
      <PageHeader 
        title="Task Types Configuration"
        description="Manage the types of tasks assistants can perform, their default rates, and active status."
      />
      <TaskTypesStatCardsRow />
      
      <div className="flex flex-col gap-6">
        <TaskTypesTableFilters
          statusFilter={statusFilter}
          sort={sort}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onSortChange={setSort}
        />
        
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Loading configurations...</div>
        ) : isError ? (
          <div className="p-6 text-center text-destructive">Failed to load configurations.</div>
        ) : filteredTaskTypes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-white rounded-xl border border-border/50">
            No task types found matching the criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTaskTypes.map((task) => (
              <ConfigCard
                key={task.id}
                title={task.name}
                description={task.description}
                status={task.isActive ? 'active' : 'inactive'}
                lastUpdated={new Date(task.updatedAt).toLocaleDateString()}
                primaryActionLabel="Edit Config"
                secondaryActionLabel="Rates"
                onPrimaryAction={() => console.log('Edit config', task.id)}
                onSecondaryAction={() => console.log('Edit rates', task.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-8">
          <DangerZone
            title="Archive Unused Task Types"
            description="Permanently archive task types that have not been used in the last 12 months. This will not affect historical data."
            actionLabel="Archive Types"
            onAction={() => console.log('DangerZone: Archive triggered')}
          />
        </div>
      </div>
    </div>
  )
}
