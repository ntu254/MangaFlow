import { StatCard } from "@/features/admin/components";
import { adminDashboardService } from "@/features/admin/services/admin-dashboard.service";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Heart,
  MousePointerClick,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => adminDashboardService.getStats(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground font-body">Dashboard</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 animate-pulse">
              <div className="h-3 w-20 bg-muted rounded mb-3" />
              <div className="h-6 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxUsers = Math.max(...data.userGrowth.map((d) => d.users));
  const maxStyle = Math.max(...data.topStyles.map((d) => d.count));

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">Tổng Quan</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Hiệu suất tổng thể của nền tảng</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Tổng người dùng" value={data.totalUsers.toLocaleString()} change="+12% tháng trước" trend="up" icon={Users} />
        <StatCard label="Hoạt động hôm nay" value={data.activeToday.toLocaleString()} change="+8% hôm qua" trend="up" icon={Activity} />
        <StatCard label="Outfit đã tạo" value={data.outfitsGenerated.toLocaleString()} change="+23% tuần này" trend="up" icon={Sparkles} />
        <StatCard label="Upload tủ đồ" value={data.wardrobeUploads.toLocaleString()} change="+5% tuần này" trend="up" icon={Upload} />
        <StatCard label="Outfit đã lưu" value={data.savedOutfits.toLocaleString()} change="+18% tháng này" trend="up" icon={Heart} />
        <StatCard label="Click liên kết" value={data.affiliateClicks.toLocaleString()} change="-3% tuần trước" trend="down" icon={MousePointerClick} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">Tăng trưởng người dùng</h3>
          <div className="flex items-end gap-3 h-[220px]">
            {data.userGrowth.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-body text-muted-foreground">{d.users.toLocaleString()}</span>
                <div className="w-full bg-muted rounded-sm overflow-hidden flex-1 flex flex-col justify-end">
                  <div className="w-full bg-accent transition-all duration-500 rounded-t-sm" style={{ height: `${(d.users / maxUsers) * 100}%` }} />
                </div>
                <span className="text-[10px] font-body text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">Danh mục outfit</h3>
          <div className="space-y-4 mt-6">
            {data.outfitCategories.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-body text-foreground">{c.name}</span>
                  <span className="text-xs font-body text-muted-foreground">{c.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full transition-all duration-500`} style={{ width: `${c.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">Phong cách hàng đầu</h3>
          <div className="space-y-3">
            {data.topStyles.map((s) => (
              <div key={s.style}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-body text-foreground">{s.style}</span>
                  <span className="text-xs font-body text-muted-foreground">{s.count.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(s.count / maxStyle) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">Hoạt động gần đây</h3>
          <div className="space-y-3">
            {data.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">{a.user[0]}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground font-body">{a.user}</p>
                    <p className="text-xs text-muted-foreground font-body">{a.action}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-body">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
