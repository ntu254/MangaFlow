import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Shield, ArrowRight, CheckCircle2, UserCog } from 'lucide-react'

export function BoardGovernanceCard() {
  return (
    <Card className="shadow-sm border-gray-100 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Shield size={18} className="text-purple-600" />
          Board Governance
        </CardTitle>
        <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">View board <ArrowRight size={12}/></a>
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Quorum Status</p>
              <p className="text-sm text-emerald-600 font-medium">Quorum Met (9/9)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <UserCog size={18} className="text-purple-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Chair Assigned</p>
              <p className="text-sm text-gray-600">Akira S.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Voting Readiness</p>
              <p className="text-sm text-emerald-600 font-medium">Ready</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-900 mb-3">Active Board Members (9)</p>
          <div className="flex -space-x-2">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center z-10">
              +2
            </div>
          </div>
        </div>
      </CardContent>
      <div className="bg-gray-50/50 p-4 border-t border-gray-100 rounded-b-xl text-xs text-gray-600 flex justify-between items-center">
        <span className="font-medium text-gray-900">Next Board Meeting:</span>
        <span>May 28, 2025 • 10:00 AM JST</span>
      </div>
    </Card>
  )
}
