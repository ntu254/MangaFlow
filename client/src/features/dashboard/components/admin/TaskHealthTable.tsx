import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Layers, ArrowRight, PenTool, Type, Image as ImageIcon, ShieldCheck } from 'lucide-react'

export function TaskHealthTable() {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Layers size={18} className="text-purple-600" />
          Task Type Health
        </CardTitle>
        <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">View all task types <ArrowRight size={12}/></a>
      </CardHeader>
      <CardContent className="pt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Task Type</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium text-right">Usage (30d)</th>
              <th className="pb-2 font-medium text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <TaskRow icon={<PenTool size={14}/>} name="Line Art" status="Active" usage="1,248" trend="up" />
            <TaskRow icon={<Layers size={14}/>} name="Tone" status="Active" usage="982" trend="up" />
            <TaskRow icon={<Type size={14}/>} name="Lettering" status="Active" usage="756" trend="down" />
            <TaskRow icon={<ImageIcon size={14}/>} name="Background" status="Active" usage="634" trend="up" />
            <TaskRow icon={<ShieldCheck size={14}/>} name="QC" status="Inactive" usage="112" trend="down" />
          </tbody>
        </table>
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <a href="#" className="text-xs text-primary hover:underline flex items-center justify-center gap-1">Manage task types <ArrowRight size={12}/></a>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskRow({ icon, name, status, usage, trend }: any) {
  const isActive = status === 'Active'
  return (
    <tr className="group">
      <td className="py-2.5 flex items-center gap-2">
        <div className="text-purple-600 bg-purple-50 p-1.5 rounded-md group-hover:bg-purple-100 transition-colors">
          {icon}
        </div>
        <span className="font-medium text-gray-900">{name}</span>
      </td>
      <td className="py-2.5">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <span className={isActive ? 'text-emerald-600 text-xs font-medium' : 'text-red-600 text-xs font-medium'}>{status}</span>
        </div>
      </td>
      <td className="py-2.5 text-right font-medium text-gray-700">{usage}</td>
      <td className="py-2.5 text-right">
        {trend === 'up' ? (
          <svg className="w-8 h-4 ml-auto text-emerald-500" fill="none" viewBox="0 0 24 12" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 10l6-6 4 4 10-8" />
          </svg>
        ) : (
          <svg className="w-8 h-4 ml-auto text-red-500" fill="none" viewBox="0 0 24 12" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l6 6 4-4 10 8" />
          </svg>
        )}
      </td>
    </tr>
  )
}
