import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Crown,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiBaseUrl, parseApiResponse } from "@/shared/api";
import {
  fetchBoardMembers,
  addBoardMember,
  removeBoardMember,
  updateBoardMember,
  setBoardChair,
  type BoardMember,
} from "@/features/board/api/board";

type UserInfo = {
  id: string;
  email: string;
  fullName: string;
  systemRole: string;
};

type MemberWithUser = BoardMember & {
  userInfo?: UserInfo;
};

type PageState = {
  members: MemberWithUser[];
  users: UserInfo[];
  isLoading: boolean;
  error: string | null;
};

export function AdminBoardMembersPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<PageState>({
    members: [],
    users: [],
    isLoading: true,
    error: null,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"BOARD_MEMBER" | "BOARD_CHAIR">("BOARD_MEMBER");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const [members, usersRes] = await Promise.all([
        fetchBoardMembers(token),
        fetch(`${apiBaseUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersBody = await usersRes.json();
      const users: UserInfo[] = usersBody.success ? usersBody.data.users : [];

      const membersWithUser = members.map((m) => ({
        ...m,
        userInfo: users.find((u) => u.id === m.userId),
      }));

      setState({ members: membersWithUser, users, isLoading: false, error: null });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Failed to load board members",
      }));
    }
  }, [getToken]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    setAddLoading(true);
    setAddError(null);
    const token = await getToken();
    if (!token) { setAddLoading(false); return; }
    try {
      await addBoardMember(token, selectedUserId, selectedRole);
      setAddOpen(false);
      setSelectedUserId("");
      setSelectedRole("BOARD_MEMBER");
      await loadData();
    } catch (err: any) {
      setAddError(err.message || "Failed to add member");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleSetChair(memberId: string) {
    setActionLoading(`chair-${memberId}`);
    const token = await getToken();
    if (!token) { setActionLoading(null); return; }
    try {
      await setBoardChair(token, memberId);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to set chair");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this board member?")) return;
    setActionLoading(`remove-${memberId}`);
    const token = await getToken();
    if (!token) { setActionLoading(null); return; }
    try {
      await removeBoardMember(token, memberId);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleStatus(memberId: string, status: "ACTIVE" | "INACTIVE") {
    setActionLoading(`status-${memberId}`);
    const token = await getToken();
    if (!token) { setActionLoading(null); return; }
    try {
      await updateBoardMember(token, memberId, { status });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  }

  const availableUsers = state.users.filter(
    (u) =>
      (u.systemRole === "BOARD" || u.systemRole === "ADMIN") &&
      !state.members.some((m) => m.userId === u.id)
  );

  const activeCount = state.members.filter((m) => m.status === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link to="/app/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-[#9065d5] hover:text-[#7f55c7] mb-3">
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              Board Members
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Manage the Editorial Board. Board size: {activeCount} active member{activeCount !== 1 ? "s" : ""}.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger render={
                <Button className="bg-[#9065d5] hover:bg-[#7c54be] text-white" disabled={availableUsers.length === 0}>
                  <Plus className="size-4 mr-2" /> Add Member
                </Button>
              } />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Board Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-4">
                  {addError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{addError}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#5f5270]">User</Label>
                    <Select value={selectedUserId} onValueChange={(v) => { if (v) setSelectedUserId(v); }} disabled={addLoading}>
                      <SelectTrigger className="w-full border-[#eadff6] rounded-xl text-sm">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.fullName} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#5f5270]">Role</Label>
                    <Select value={selectedRole} onValueChange={(v) => { if (v === "BOARD_MEMBER" || v === "BOARD_CHAIR") setSelectedRole(v); }} disabled={addLoading}>
                      <SelectTrigger className="w-full border-[#eadff6] rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOARD_MEMBER">Board Member</SelectItem>
                        <SelectItem value="BOARD_CHAIR">Board Chair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="mt-6">
                    <DialogClose render={<Button variant="outline" disabled={addLoading}>Cancel</Button>} />
                    <Button type="submit" disabled={addLoading || !selectedUserId} className="bg-[#9065d5] hover:bg-[#7c54be] text-white">
                      {addLoading ? <><Loader2 className="size-4 animate-spin mr-2" /> Adding...</> : "Add"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => void loadData()} className="border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12">
        {state.error && (
          <div className="bg-[#ffe7de] border border-[#ff7196]/30 p-4 rounded-xl text-[#e15f2f] text-sm mb-6">
            {state.error}
          </div>
        )}

        <div className="bg-white border border-[#eadff6] rounded-2xl p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)]">
          {state.isLoading ? (
            <div className="flex items-center justify-center py-12 text-[#5f5270]">
              <Loader2 className="size-6 animate-spin text-[#9065d5]" />
            </div>
          ) : state.members.length === 0 ? (
            <div className="text-center py-12 text-[#5f5270]">
              <p className="text-sm font-medium">No board members yet</p>
              <p className="text-xs mt-1">Add users with BOARD or ADMIN role to the editorial board.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#eadff6]">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Member</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#8a7a99]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.members.map((member) => (
                    <tr key={member.id} className="border-b border-[#f3d7e7]/50 last:border-0">
                      <td className="py-3 px-4">
                        <strong className="text-[#2f243a]">{member.userInfo?.fullName || "Unknown"}</strong>
                        <p className="text-xs text-[#8a7a99]">{member.userInfo?.email || member.userId}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          member.role === "BOARD_CHAIR"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}>
                          {member.role === "BOARD_CHAIR" ? (
                            <><Crown className="size-3 mr-1 inline" /> Chair</>
                          ) : "Member"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          member.status === "ACTIVE"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}>
                          {member.status === "ACTIVE" ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          {member.role !== "BOARD_CHAIR" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-[#eadff6] text-amber-700 hover:bg-amber-50"
                              disabled={actionLoading === `chair-${member.id}`}
                              onClick={() => void handleSetChair(member.id)}
                            >
                              {actionLoading === `chair-${member.id}` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <><Crown className="size-3 mr-1" /> Set Chair</>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className={`text-xs border-[#eadff6] ${
                              member.status === "ACTIVE"
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            disabled={actionLoading === `status-${member.id}`}
                            onClick={() => void handleToggleStatus(member.id, member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                          >
                            {actionLoading === `status-${member.id}` ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : member.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                            disabled={actionLoading === `remove-${member.id}`}
                            onClick={() => void handleRemove(member.id)}
                          >
                            {actionLoading === `remove-${member.id}` ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Trash2 className="size-3" />
                            )}
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
