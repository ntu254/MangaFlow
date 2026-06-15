import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Vote, BarChart2, AlertTriangle } from 'lucide-react'

const stats = [
  { label: 'Pending Votes', value: '2', icon: Vote, color: 'text-purple-500' },
  { label: 'Active Series', value: '11', icon: BookOpen, color: 'text-blue-500' },
  { label: 'At-Risk Series', value: '1', icon: AlertTriangle, color: 'text-red-500' },
  { label: 'Avg Ranking Score', value: '72.4', icon: BarChart2, color: 'text-green-500' },
]

export default function BoardDashboard() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Board Dashboard</h1>
        <p className='text-muted-foreground'>Editorial decisions and ranking overview</p>
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
