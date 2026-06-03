import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserButton } from "@clerk/react";
import { Ban, RefreshCw, RotateCcw, UserCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  assignableSystemRoles,
  buildAdminRoleReviewUrl,
  buildAdminUserRoleUrl,
  buildAdminUserStatusUrl,
} from "@/features/auth/admin-flow";
import { apiBaseUrl } from "@/shared/api";
import type { GetTokenFn } from "@/shared/api";

type RoleReviewUser = {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  systemRole: string | null;
  status: string;
  requestedSystemRole: "MANGAKA" | "ASSISTANT" | null;
};

type AdminReviewState =
  | { status: "loading" }
  | { status: "ready"; users: RoleReviewUser[] }
  | { status: "error"; message: string };

type AdminRoleReviewPageProps = {
  getToken: GetTokenFn;
};

export function AdminRoleReviewPage({ getToken }: AdminRoleReviewPageProps) {
  const [state, setState] = useState<AdminReviewState>({ status: "loading" });
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function fetchPendingUsers() {
    setState({ status: "loading" });
    const token = await getToken({ template: "mangaflow" });

    if (!token) {
      setState({ status: "error", message: "Authentication token unavailable." });
      return;
    }

    const response = await fetch(buildAdminRoleReviewUrl(apiBaseUrl), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      setState({ status: "error", message: body.message ?? "Role review failed." });
      return;
    }

    setState({ status: "ready", users: body.data.users });
  }

  async function updateRole(userId: string, systemRole: string) {
    setBusyUserId(userId);
    const token = await getToken({ template: "mangaflow" });

    if (!token) {
      setState({ status: "error", message: "Authentication token unavailable." });
      setBusyUserId(null);
      return;
    }

    const response = await fetch(buildAdminUserRoleUrl(apiBaseUrl, userId), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ systemRole }),
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      setState({ status: "error", message: body.message ?? "Role update failed." });
      setBusyUserId(null);
      return;
    }

    await fetchPendingUsers();
    setBusyUserId(null);
  }

  async function updateStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
    setBusyUserId(userId);
    const token = await getToken({ template: "mangaflow" });

    if (!token) {
      setState({ status: "error", message: "Authentication token unavailable." });
      setBusyUserId(null);
      return;
    }

    const response = await fetch(buildAdminUserStatusUrl(apiBaseUrl, userId), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      setState({ status: "error", message: body.message ?? "Status update failed." });
      setBusyUserId(null);
      return;
    }

    await fetchPendingUsers();
    setBusyUserId(null);
  }

  useEffect(() => {
    void fetchPendingUsers();
  }, []);

  return (
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link to="/app/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-[#9065d5] hover:text-[#7f55c7] mb-3">
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              Role Review
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Pending users awaiting system-role assignment.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
            <Button variant="outline" onClick={fetchPendingUsers} className="border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12">
        <div className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8a7a99] mb-1">Pending users</p>
              <h2 className="text-xl font-bold text-[#2f243a]">
                {state.status === "ready" ? `${state.users.length} waiting` : "Loading"}
              </h2>
            </div>
          </div>

          {state.status === "error" && (
            <p className="text-sm text-[#e15f2f] bg-[#ffe7de] p-3 rounded-lg mb-4">{state.message}</p>
          )}

          {state.status === "ready" && state.users.length === 0 && (
            <div className="text-center py-12 text-[#5f5270]">
              <UserCheck className="mx-auto size-8 text-[#b8a9c7] mb-2" />
              <p className="text-sm font-medium">No pending role requests</p>
            </div>
          )}

          {state.status === "ready" && state.users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#eadff6]">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">User</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Request</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {state.users.map((user) => (
                    <tr key={user.id} className="border-b border-[#f3d7e7]/50 last:border-0">
                      <td className="py-3 px-4">
                        <strong className="text-[#2f243a]">{user.fullName}</strong>
                        <p className="text-xs text-[#8a7a99]">{user.email}</p>
                      </td>
                      <td className="py-3 px-4 text-[#5f5270]">{user.requestedSystemRole ?? "None"}</td>
                      <td className="py-3 px-4 text-[#5f5270]">{user.status}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {assignableSystemRoles.map((role) => (
                            <Button
                              key={role}
                              size="sm"
                              variant={role === user.requestedSystemRole ? "default" : "outline"}
                              className={`text-xs ${role === user.requestedSystemRole ? "bg-[#9065d5] text-white" : "border-[#eadff6] text-[#5f5270]"}`}
                              disabled={busyUserId === user.id}
                              onClick={() => void updateRole(user.id, role)}
                            >
                              {role}
                            </Button>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                            disabled={busyUserId === user.id}
                            onClick={() => void updateStatus(user.id, "SUSPENDED")}
                          >
                            <Ban className="size-3 mr-1" /> Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-[#eadff6] text-[#5f5270]"
                            disabled={busyUserId === user.id}
                            onClick={() => void updateStatus(user.id, "ACTIVE")}
                          >
                            <RotateCcw className="size-3 mr-1" /> Active
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
