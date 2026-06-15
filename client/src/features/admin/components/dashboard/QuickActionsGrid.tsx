import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, UserPlus, Shield, Layers, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActionsGrid() {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity size={18} className="text-purple-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="justify-start gap-2 h-10 text-gray-700 font-medium">
            <UserPlus size={16} className="text-purple-600" /> Create User
          </Button>
          <Button variant="outline" className="justify-start gap-2 h-10 text-gray-700 font-medium">
            <Shield size={16} className="text-purple-600" /> Manage Board
          </Button>
          <Button variant="outline" className="justify-start gap-2 h-10 text-gray-700 font-medium">
            <Layers size={16} className="text-purple-600" /> Add Task Type
          </Button>
          <Button variant="outline" className="justify-start gap-2 h-10 text-gray-700 font-medium">
            <FileText size={16} className="text-purple-600" /> View Audit Log
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
