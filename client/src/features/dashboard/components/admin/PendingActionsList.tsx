import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { ShieldAlert, ArrowRight, Users, Shield, Layers, ChevronRight } from 'lucide-react'

export function PendingActionsList() {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldAlert size={18} className="text-purple-600" />
          Pending Admin Actions
        </CardTitle>
        <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight size={12}/></a>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        
        <div className="flex items-start gap-3 p-3 rounded-lg border border-purple-100 bg-purple-50/50 hover:bg-purple-50 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Users size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Approve 3 invited users</p>
            <p className="text-xs text-gray-500">New users awaiting approval</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium flex items-center justify-center">3</span>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-primary" />
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Shield size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Review 2 inactive board members</p>
            <p className="text-xs text-gray-500">Board members inactive &gt; 30 days</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">2</span>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-primary" />
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg border border-orange-100 bg-orange-50/50 hover:bg-orange-50 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Layers size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Resolve 1 task type deactivation conflict</p>
            <p className="text-xs text-gray-500">Conflicting dependencies detected</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-medium flex items-center justify-center">1</span>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-primary" />
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
