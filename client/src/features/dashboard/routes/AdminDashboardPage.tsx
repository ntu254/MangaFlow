import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BarChart3,
  Settings,
  Loader2,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { apiBaseUrl } from "@/shared/api";
import {
  buildAdminRoleReviewUrl,
} from "@/features/auth/admin-flow";
import type { AuthRouteUser } from "@/features/auth/auth-flow";

type AdminStats = {
  pendingReviews: number;
};

export function AdminDashboardPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<AdminStats>({ pendingReviews: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(buildAdminRoleReviewUrl(apiBaseUrl), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();

      if (response.ok && body.success) {
        setStats({ pendingReviews: body.data.users.length });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-[#5f5270]">
          <Loader2 className="size-8 animate-spin text-[#9065d5]" />
          <span>Loading Admin Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Badge variant="outline" className="text-[#9065d5] border-[#eadff6] mb-2">
              Admin Panel
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              System Administration
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Manage users, roles, and system settings.
            </p>
          </div>
          <Button onClick={loadData} variant="outline" className="border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-10">
        {error && (
          <div className="bg-[#ffe7de] border border-[#ff7196]/30 p-4 rounded-xl text-[#e15f2f] text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/app/admin/role-review" className="block group">
            <div className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)] hover:border-[#9065d5]/30 hover:shadow-[0_8px_24px_rgba(144,101,213,0.1)] transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-[#ece5ff] rounded-lg text-[#9065d5]">
                  <Users className="size-5" />
                </div>
                {stats.pendingReviews > 0 && (
                  <Badge className="bg-[#ff7196] text-white border-none">
                    {stats.pendingReviews}
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-[#2f243a] mb-1">Role Review</h3>
              <p className="text-xs text-[#5f5270]">Approve or assign system roles to users</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#9065d5] group-hover:gap-2 transition-all">
                Open <ArrowUpRight className="size-3.5" />
              </div>
            </div>
          </Link>

          <div className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)] opacity-60">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#ffe6f2] rounded-lg text-[#e560bc]">
                <BarChart3 className="size-5" />
              </div>
            </div>
            <h3 className="font-bold text-[#2f243a] mb-1">Analytics</h3>
            <p className="text-xs text-[#5f5270]">System-wide analytics and reporting</p>
            <p className="mt-4 text-xs text-[#8a7a99]">Coming soon</p>
          </div>

          <div className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)] opacity-60">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#fff0dc] rounded-lg text-[#d97706]">
                <Settings className="size-5" />
              </div>
            </div>
            <h3 className="font-bold text-[#2f243a] mb-1">Settings</h3>
            <p className="text-xs text-[#5f5270]">System configuration and preferences</p>
            <p className="mt-4 text-xs text-[#8a7a99]">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
