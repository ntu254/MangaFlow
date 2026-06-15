import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Layers, MessageSquare, CheckSquare } from 'lucide-react'

const stats = [
  { label: 'Manuscripts to Review', value: '3', icon: FileText, color: 'text-purple-500' },
  { label: 'Chapters in Review', value: '6', icon: Layers, color: 'text-blue-500' },
  { label: 'Open Comments', value: '14', icon: MessageSquare, color: 'text-orange-500' },
  { label: 'Approved This Week', value: '8', icon: CheckSquare, color: 'text-green-500' },
]

export default function EditorDashboard() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Editor Dashboard</h1>
        <p className='text-muted-foreground'>Review queue and approval status</p>
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
