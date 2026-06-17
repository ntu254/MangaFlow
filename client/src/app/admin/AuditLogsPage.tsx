import { useState } from 'react'
import { PageHeader } from '@/shared/components/ui/page-header'
import { FilterBar } from '@/shared/components/ui/filter-bar'
import { AuditLogRow, type AuditLogItem } from '@/features/admin/components/AuditLogRow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

const MOCK_LOGS: AuditLogItem[] = [
  { id: '1', actor: 'Admin User', action: 'suspended account', target: 'John Doe', timestamp: '2026-06-17 10:23:45', severity: 'danger' },
  { id: '2', actor: 'System', action: 'archived config', target: 'Old Payment Rates 2024', timestamp: '2026-06-16 23:00:00', severity: 'warning' },
  { id: '3', actor: 'Jane Smith', action: 'updated task type', target: 'Background Cleanup', timestamp: '2026-06-15 14:12:00', severity: 'info' },
  { id: '4', actor: 'Admin User', action: 'granted role', target: 'Editor to Emily', timestamp: '2026-06-14 09:45:11', severity: 'success' },
]

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')

  const filteredLogs = MOCK_LOGS.filter((log) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = !query || log.actor.toLowerCase().includes(query) || log.target.toLowerCase().includes(query) || log.action.toLowerCase().includes(query)
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter.toLowerCase()
    return matchesSearch && matchesSeverity
  })

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-10'>
      <PageHeader 
        title="Audit Logs"
        description="Track all administrative actions, system events, and security-related changes across the platform."
      />
      
      <div className="flex flex-col gap-4">
        <FilterBar
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search actor, action, target..."
        >
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-10 w-[160px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="DANGER">Danger</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>

        <div className="bg-white rounded-xl shadow-sm border border-border/50 flex flex-col overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No audit logs found matching the criteria.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredLogs.map(log => (
                <AuditLogRow key={log.id} item={log} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
