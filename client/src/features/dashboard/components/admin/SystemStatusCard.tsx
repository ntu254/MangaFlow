import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react'

export function SystemStatusCard() {
  return (
    <Card className="shadow-sm border-gray-100 flex-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldCheck size={18} className="text-purple-600" />
          System Status (API)
        </CardTitle>
        <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">View status page <ArrowRight size={12}/></a>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
          <ApiStatus name="Auth API" />
          <ApiStatus name="Series API" />
          <ApiStatus name="Task API" />
          <ApiStatus name="Submission API" />
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>Last checked: May 24, 2025 09:42 AM JST</span>
          <span className="text-emerald-600 font-medium">All systems normal</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ApiStatus({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
      <div>
        <p className="text-xs font-medium text-gray-900">{name}</p>
        <p className="text-[10px] text-emerald-600">Operational</p>
      </div>
    </div>
  )
}
