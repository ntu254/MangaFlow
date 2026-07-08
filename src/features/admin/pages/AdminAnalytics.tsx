import { StatCard } from "@/features/admin/components";
import { adminAnalyticsService } from "@/features/admin/services/admin-analytics.service";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  Eye,
  Heart,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => adminAnalyticsService.getData(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div><h1 className="text-2xl font-semibold text-foreground font-body">AI Analytics</h1><p className="text-sm text-muted-foreground font-body mt-1 animate-pulse">Loading...</p></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-lg p-5 animate-pulse"><div className="h-3 w-20 bg-muted rounded mb-3" /><div className="h-6 w-16 bg-muted rounded" /></div>)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxGen = Math.max(...data.dailyGenerations.map((d) => d.count));
  const maxAcc = 100;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">Phân Tích AI</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Theo dõi hiệu suất AI và mức độ tương tác của người dùng</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Tổng lượt tạo" value={data.stats.totalGenerations} change="23% tháng này" trend="up" icon={Sparkles} />
        <StatCard label="Độ chính xác" value={data.stats.detectionAccuracy} change="+2.1% cải thiện" trend="up" icon={Target} />
        <StatCard label="Độ tin cậy TB" value={data.stats.avgConfidence} change="+1.8% tuần này" trend="up" icon={Brain} />
        <StatCard label="Phong cách đầu" value={data.stats.topStyle} icon={TrendingUp} />
        <StatCard label="Lưu nhiều nhất" value={data.stats.mostSaved} change="18% tuần này" trend="up" icon={Heart} />
        <StatCard label="Nhận diện lỗi" value={data.stats.failedDetections} change="Giảm 5%" trend="up" icon={Eye} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">Lượt tạo AI theo ngày</h3>
          <div className="flex items-end gap-3 h-[220px]">
            {data.dailyGenerations.map((d, i) => (
              <div key={`${d.day}-${i}`} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-body text-muted-foreground">{d.count.toLocaleString()}</span>
                <div className="w-full bg-muted rounded-sm overflow-hidden flex-1 flex flex-col justify-end">
                  <div className="w-full bg-accent transition-all duration-500 rounded-t-sm" style={{ height: `${(d.count / maxGen) * 100}%` }} />
                </div>
                <span className="text-[10px] font-body text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">Xu hướng độ chính xác nhận diện</h3>
          <div className="space-y-3 mt-2">
            {data.accuracyTrend.map((d) => (
              <div key={d.month}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-body text-foreground">{d.month}</span>
                  <span className="text-xs font-semibold font-body text-teal">{d.rate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${(d.rate / maxAcc) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">Loại prompt phổ biến</h3>
          <div className="space-y-3">
            {data.topPrompts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground font-body w-5">{i + 1}</span>
                  <span className="text-sm font-body">{p.prompt}</span>
                </div>
                <span className="text-sm font-semibold font-body text-foreground">{p.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">Nhận diện thất bại phổ biến</h3>
          <div className="space-y-3">
            {data.failedDetections.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-body">{f.item}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-body text-muted-foreground">{f.count} trường hợp</span>
                  <span className="text-sm font-semibold font-body text-destructive">{f.rate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
