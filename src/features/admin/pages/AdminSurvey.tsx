import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib";
import { StatusBadge } from "@/features/admin/components";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MessageSquare, TrendingUp, Users, CheckCircle } from "lucide-react";

interface SurveyResponse {
  id: string;
  user_id: string | null;
  session_id: string | null;
  feature: string;
  survey_version: string;
  context: Record<string, unknown>;
  responses: Record<string, unknown>;
  feedback: string | null;
  sheets_synced: boolean;
  sheets_row: number | null;
  sheets_error: string | null;
  submitted_at: string;
  created_at: string;
}

const FEATURE_LABELS: Record<string, string> = {
  quiz: "Quiz Style",
  recommender: "AI Stylist",
  tryon: "Thử đồ ảo",
};

const COLORS = ["#1C1C1C", "#E8B4B8", "#9CAF88", "#6B8DAD", "#8B7355"];

export default function AdminSurvey() {
  const { data: responses, isLoading } = useQuery({
    queryKey: ["admin", "survey-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SurveyResponse[];
    },
  });

  const stats = {
    total: responses?.length || 0,
    quiz: responses?.filter((r) => r.feature === "quiz").length || 0,
    recommender: responses?.filter((r) => r.feature === "recommender").length || 0,
    tryon: responses?.filter((r) => r.feature === "tryon").length || 0,
    sheetsSynced: responses?.filter((r) => r.sheets_synced).length || 0,
  };

  const featureData = Object.entries(FEATURE_LABELS).map(([key, label]) => ({
    name: label,
    value: stats[key as keyof typeof stats] || 0,
  }));

  const averageRatings = responses?.length
    ? {
        ui: {
          easyView: average(responses, "ui_easy_view"),
          easyUnderstand: average(responses, "ui_easy_understand"),
          easyUse: average(responses, "ui_easy_use"),
        },
        feature: {
          accurate: average(responses, "feature_accurate"),
          links: average(responses, "feature_links"),
          quality: average(responses, "feature_quality"),
        },
        experience: {
          fun: average(responses, "exp_fun"),
          reuse: average(responses, "exp_reuse"),
          recommend: average(responses, "exp_recommend"),
        },
      }
    : null;

  const ratingData = averageRatings
    ? [
        { name: "Dễ nhìn", value: averageRatings.ui.easyView },
        { name: "Dễ hiểu", value: averageRatings.ui.easyUnderstand },
        { name: "Dễ dùng", value: averageRatings.ui.easyUse },
        { name: "Đúng YC", value: averageRatings.feature.accurate },
        { name: "Chất lượng", value: averageRatings.feature.quality },
        { name: "Vui vẻ", value: averageRatings.experience.fun },
        { name: "Dùng lại", value: averageRatings.experience.reuse },
        { name: "Giới thiệu", value: averageRatings.experience.recommend },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground font-body">
            Survey Dashboard
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1 animate-pulse">
            Loading...
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-12 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">
          Survey Dashboard
        </h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          {stats.total} tổng số phản hồi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Tổng phản hồi"
          value={stats.total}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Đã sync Sheets"
          value={stats.sheetsSynced}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Quiz"
          value={stats.quiz}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Try-on"
          value={stats.tryon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">
            Phản hồi theo tính năng
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={featureData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {featureData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-foreground font-body mb-4">
            Điểm trung bình (1-5)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1C1C1C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground font-body">
            Phản hồi gần đây
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-body font-semibold text-muted-foreground">
                  Thời gian
                </th>
                <th className="text-left p-3 text-xs font-body font-semibold text-muted-foreground">
                  Tính năng
                </th>
                <th className="text-left p-3 text-xs font-body font-semibold text-muted-foreground">
                  User
                </th>
                <th className="text-left p-3 text-xs font-body font-semibold text-muted-foreground">
                  Sheets
                </th>
                <th className="text-left p-3 text-xs font-body font-semibold text-muted-foreground">
                  Phản hồi
                </th>
              </tr>
            </thead>
            <tbody>
              {responses?.slice(0, 20).map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-xs font-body text-muted-foreground">
                    {new Date(r.submitted_at).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3 text-xs font-body font-medium">
                    {FEATURE_LABELS[r.feature] || r.feature}
                  </td>
                  <td className="p-3 text-xs font-body text-muted-foreground">
                    {r.user_id?.slice(0, 8) || r.session_id?.slice(0, 8) || "N/A"}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={r.sheets_synced ? "resolved" : "pending"} />
                  </td>
                  <td className="p-3 text-xs font-body text-muted-foreground max-w-xs truncate">
                    {getFeedbackText(r) || JSON.stringify(r.responses).slice(0, 50)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getFeedbackText(response: SurveyResponse): string {
  if (response.feedback) return response.feedback;
  const feedback = response.responses.feedback;
  return typeof feedback === "string" ? feedback : "";
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
          <p className="text-xs font-body text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function average(responses: SurveyResponse[], field: string): number {
  const values = responses
    .map((r) => r.responses[field])
    .filter((v) => typeof v === "number" && v > 0);

  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
