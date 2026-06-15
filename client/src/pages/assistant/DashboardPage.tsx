import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Clock, DollarSign, AlertCircle } from 'lucide-react'

const stats = [
  { label: 'Active Tasks', value: '4', icon: CheckSquare, color: 'text-blue-500' },
  { label: 'Due Today', value: '2', icon: Clock, color: 'text-orange-500' },
  { label: 'Overdue', value: '0', icon: AlertCircle, color: 'text-red-500' },
  { label: 'Earnings', value: '320 pts', icon: DollarSign, color: 'text-green-500' },
]

export default function AssistantDashboard() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Assistant Dashboard</h1>
        <p className='text-muted-foreground'>Your tasks and earnings overview</p>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>{s.label}</CardTitle>
              <s.icon size={18} className={s.color} />
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
