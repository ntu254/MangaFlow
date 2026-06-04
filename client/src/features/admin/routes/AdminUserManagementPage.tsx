import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ban, RefreshCw, RotateCcw, KeyRound, Plus, ArrowLeft, Loader2, AlertCircle, Mail, Lock, UserIcon, Users, UserCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  assignableSystemRoles,
  buildAdminUsersUrl,
  buildAdminUserRoleUrl,
  buildAdminUserStatusUrl,
  buildAdminUserResetPasswordUrl,
} from "@/features/auth/admin-flow";
import { apiBaseUrl } from "@/shared/api";

type ManagedUser = {
  id: string;
  email: string;
  fullName: string;
  systemRole: string | null;
  status: string;
};

type PageState =
  | { status: "loading" }
  | { status: "ready"; users: ManagedUser[] }
  | { status: "error"; message: string };

export function AdminUserManagementPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function fetchUsers() {
    setState({ status: "loading" });
    const token = await getToken();
    if (!token) {
      setState({ status: "error", message: "Authentication token unavailable." });
      return;
    }
    const response = await fetch(buildAdminUsersUrl(apiBaseUrl), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      setState({ status: "error", message: body.message ?? "Failed to load users." });
      return;
    }
    setState({ status: "ready", users: body.data.users });
  }

  async function updateRole(userId: string, systemRole: string) {
    setBusyUserId(userId);
    const token = await getToken();
    if (!token) { setBusyUserId(null); return; }
    const response = await fetch(buildAdminUserRoleUrl(apiBaseUrl, userId), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ systemRole }),
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      setState({ status: "error", message: body.message ?? "Role update failed." });
      setBusyUserId(null); return;
    }
    await fetchUsers();
    setBusyUserId(null);
  }

  async function updateStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
    setBusyUserId(userId);
    const token = await getToken();
    if (!token) { setBusyUserId(null); return; }
    const response = await fetch(buildAdminUserStatusUrl(apiBaseUrl, userId), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      setState({ status: "error", message: body.message ?? "Status update failed." });
      setBusyUserId(null); return;
    }
    await fetchUsers();
    setBusyUserId(null);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!createEmail || !createName || !createPassword || !createRole) {
      setCreateError("All fields are required.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    const token = await getToken();
    if (!token) { setCreateLoading(false); setCreateError("Not authenticated."); return; }
    const response = await fetch(buildAdminUsersUrl(apiBaseUrl), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: createEmail,
        fullName: createName,
        password: createPassword,
        systemRole: createRole,
      }),
    });
    const body = await response.json();
    setCreateLoading(false);
    if (!response.ok || !body.success) {
      setCreateError(body.message ?? "Failed to create user.");
      return;
    }
    setCreateOpen(false);
    setCreateEmail("");
    setCreateName("");
    setCreatePassword("");
    setCreateRole("");
    await fetchUsers();
  }

  async function handleResetPassword() {
    if (!resetUser || !resetPassword) return;
    setResetLoading(true);
    setResetError(null);
    const token = await getToken();
    if (!token) { setResetLoading(false); setResetError("Not authenticated."); return; }
    const response = await fetch(buildAdminUserResetPasswordUrl(apiBaseUrl, resetUser.id), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    const body = await response.json();
    setResetLoading(false);
    if (!response.ok || !body.success) {
      setResetError(body.message ?? "Failed to reset password.");
      return;
    }
    setResetUser(null);
    setResetPassword("");
  }

  useEffect(() => { void fetchUsers(); }, []);

  return (
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link to="/app/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-[#9065d5] hover:text-[#7f55c7] mb-3">
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              User Management
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Create and manage user accounts across the system.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger render={<Button className="bg-[#9065d5] hover:bg-[#7c54be] text-white"><Plus className="size-4 mr-2" /> Create User</Button>} />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  {createError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{createError}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="create-email" className="text-xs font-semibold text-[#5f5270]">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a7a99]" />
                      <Input id="create-email" type="email" placeholder="user@example.com" value={createEmail} onChange={e => setCreateEmail(e.target.value)} disabled={createLoading} className="pl-10 border-[#eadff6] rounded-xl text-sm" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="create-name" className="text-xs font-semibold text-[#5f5270]">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a7a99]" />
                      <Input id="create-name" type="text" placeholder="Full name" value={createName} onChange={e => setCreateName(e.target.value)} disabled={createLoading} className="pl-10 border-[#eadff6] rounded-xl text-sm" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="create-password" className="text-xs font-semibold text-[#5f5270]">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a7a99]" />
                      <Input id="create-password" type="password" placeholder="Min. 6 characters" value={createPassword} onChange={e => setCreatePassword(e.target.value)} disabled={createLoading} className="pl-10 border-[#eadff6] rounded-xl text-sm" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#5f5270]">System Role</Label>
                    <Select value={createRole} onValueChange={(value) => { if (value) setCreateRole(value); }} disabled={createLoading}>
                      <SelectTrigger className="w-full border-[#eadff6] rounded-xl text-sm">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableSystemRoles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="mt-6">
                    <DialogClose render={<Button variant="outline" disabled={createLoading}>Cancel</Button>} />
                    <Button type="submit" disabled={createLoading} className="bg-[#9065d5] hover:bg-[#7c54be] text-white">
                      {createLoading ? <><Loader2 className="size-4 animate-spin mr-2" /> Creating...</> : "Create User"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={fetchUsers} className="border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-8">
        {state.status === "ready" && (
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Total Users</CardTitle>
                <Users className="size-4 text-[#9065d5]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#2f243a]">{state.users.length}</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">Registered accounts</p>
              </CardContent>
            </Card>

            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Active Users</CardTitle>
                <UserCheck className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{state.users.filter((u) => u.status === "ACTIVE").length}</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">Active in system</p>
              </CardContent>
            </Card>

            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Suspended</CardTitle>
                <Ban className="size-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">{state.users.filter((u) => u.status === "SUSPENDED").length}</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">Blocked accounts</p>
              </CardContent>
            </Card>

            <Card className="border-[#eadff6] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold tracking-wider text-[#8a7a99] uppercase">Administrators</CardTitle>
                <ShieldCheck className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{state.users.filter((u) => u.systemRole === "ADMIN").length}</div>
                <p className="text-[11px] text-[#8a7a99] mt-1">Full control access</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8a7a99] mb-1">All Users</p>
              <h2 className="text-xl font-bold text-[#2f243a]">
                {state.status === "ready" ? `${state.users.length} registered` : "Loading"}
              </h2>
            </div>
          </div>

          {state.status === "error" && (
            <p className="text-sm text-[#e15f2f] bg-[#ffe7de] p-3 rounded-lg mb-4">{state.message}</p>
          )}

          {state.status === "loading" && (
            <div className="flex items-center justify-center py-12 text-[#5f5270]">
              <Loader2 className="size-6 animate-spin text-[#9065d5]" />
            </div>
          )}

          {state.status === "ready" && state.users.length === 0 && (
            <div className="text-center py-12 text-[#5f5270]">
              <p className="text-sm font-medium">No users registered yet</p>
            </div>
          )}

          {state.status === "ready" && state.users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#eadff6]">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">User</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.users.map((user) => (
                    <tr key={user.id} className="border-b border-[#f3d7e7]/50 last:border-0">
                      <td className="py-3 px-4">
                        <strong className="text-[#2f243a]">{user.fullName}</strong>
                        <p className="text-xs text-[#8a7a99]">{user.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={user.systemRole ?? ""}
                          disabled={busyUserId === user.id}
                          onValueChange={(value) => { if (value) void updateRole(user.id, value); }}
                        >
                          <SelectTrigger size="sm" className="border-[#eadff6] text-xs">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            {assignableSystemRoles.map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {user.status === "ACTIVE" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          {user.status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-[#eadff6] text-[#e15f2f] hover:bg-red-50"
                              disabled={busyUserId === user.id}
                              onClick={() => void updateStatus(user.id, "SUSPENDED")}
                            >
                              <Ban className="size-3 mr-1" /> Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-[#eadff6] text-green-700 hover:bg-green-50"
                              disabled={busyUserId === user.id}
                              onClick={() => void updateStatus(user.id, "ACTIVE")}
                            >
                              <RotateCcw className="size-3 mr-1" /> Activate
                            </Button>
                          )}
                          <Dialog open={resetUser?.id === user.id} onOpenChange={(open) => { if (!open) { setResetUser(null); setResetPassword(""); setResetError(null); } }}>
                            <DialogTrigger render={
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-[#eadff6] text-[#5f5270]"
                                onClick={() => { setResetUser(user); setResetPassword(""); setResetError(null); }}
                              >
                                <KeyRound className="size-3 mr-1" /> Reset Password
                              </Button>
                            } />
                            <DialogContent className="sm:max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-1.5 py-2">
                                <p className="text-xs text-[#5f5270] mb-3">
                                  New password for <strong>{resetUser?.fullName}</strong>
                                </p>
                                {resetError && (
                                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs mb-2">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <span>{resetError}</span>
                                  </div>
                                )}
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a7a99]" />
                                  <Input
                                    type="password"
                                    placeholder="New password (min. 6 chars)"
                                    value={resetPassword}
                                    onChange={e => setResetPassword(e.target.value)}
                                    disabled={resetLoading}
                                    className="pl-10 border-[#eadff6] rounded-xl text-sm"
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <DialogClose render={<Button variant="outline" disabled={resetLoading}>Cancel</Button>} />
                                <Button onClick={handleResetPassword} disabled={resetLoading || !resetPassword} className="bg-[#9065d5] hover:bg-[#7c54be] text-white">
                                  {resetLoading ? <><Loader2 className="size-4 animate-spin mr-2" /> Resetting...</> : "Reset Password"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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
