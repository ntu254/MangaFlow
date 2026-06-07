import { AdminStatCard } from "../components/AdminStatCard"
import { AdminUserTable } from "../components/AdminUserTable"
import { AdminSystemHealth } from "../components/AdminSystemHealth"
import { AdminActivityLog } from "../components/AdminActivityLog"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"

export function AdminDashboardPage() {
  usePageTitle("Dashboard Overview", "Monitor system metrics and recent activities.")

  return (
    <div className="space-y-lg pr-1">


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
        <AdminStatCard icon="groups" iconBg="bg-primary-fixed" iconColor="text-on-primary-fixed" value="2,405" label="Total Active Users" trend={{ value: "12%", direction: "up" }} />
        <AdminStatCard icon="auto_stories" iconBg="bg-secondary-fixed" iconColor="text-on-secondary-fixed" value="184" label="Total Series" trend={{ value: "5%", direction: "up" }} />
        <AdminStatCard icon="assignment" iconBg="bg-tertiary-fixed" iconColor="text-on-tertiary-fixed" value="842" label="Active Assistant Tasks" trend={{ value: "0%", direction: "flat" }} />
        <AdminStatCard icon="cloud" iconBg="bg-surface-container-highest" iconColor="text-on-surface-variant" value={<>4.2<span className="text-label-md font-title-lg text-outline ml-1">TB</span></>} label="Storage Usage" trend={{ value: "85%", direction: "down" }} progress={{ value: 85, color: "bg-error" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-2 space-y-lg">
          <AdminUserTable />
        </div>
        <div className="space-y-lg">
          <AdminSystemHealth />
          <AdminActivityLog />
        </div>
      </div>
    </div>
  )
}
