import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { roleData } from '../../constants/admin' // we can reuse dashboard data for now or move it to a shared place

interface Props {
  title?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function RoleDistributionChart({ title = "Role Distribution", icon, rightElement }: Props) {
  return (
    <Card className="shadow-sm border-gray-100">
      {(title || icon || rightElement) && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {rightElement}
        </CardHeader>
      )}
      <CardContent className={title ? "" : "pt-6"}>
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold">128</span>
              <span className="text-[10px] text-gray-500">Total</span>
            </div>
          </div>
          <div className="flex-1 space-y-2.5">
            {roleData.map(role => (
              <div key={role.name} className="flex items-center text-xs">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: role.color }}></div>
                <span className="text-gray-600 flex-1">{role.name}</span>
                <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: role.percentage, backgroundColor: role.color }}></div>
                </div>
                <span className="font-medium w-6 text-right">{role.value}</span>
                <span className="text-gray-400 w-10 text-right">{role.percentage}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
