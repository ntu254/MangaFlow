import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMarkReadMutation, useNotificationsQuery } from "@/features/notifications";
import { adminApi } from "@/shared/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatusPill } from "@/shared/ui/status-pill";
import { Bell, CheckCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/ui/page-header";
import { Panel } from "@/shared/ui/panel";
import { TextButton } from "@/shared/ui/text-button";
import { formatDateTime, useAdminAccess, AccessDenied } from "../../_shared";

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "All users" },
  { value: "ROLE", label: "By role" },
  { value: "USER", label: "Specific user" },
] as const;

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "MANGAKA", label: "Mangaka" },
  { value: "ASSISTANT", label: "Assistant" },
  { value: "BOARD", label: "Board" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
] as const;

export function AdminNotificationsPage() {
  const { denial } = useAdminAccess();
  const { data: items = [], isLoading } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState<"ALL" | "ROLE" | "USER">("ALL");
  const [audienceRole, setAudienceRole] = useState("EDITOR");
  const [targetUserId, setTargetUserId] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH">("NORMAL");
  const [sending, setSending] = useState(false);

  if (denial) {
    return (
      <AccessDenied
        title="Notifications"
        description="You do not have permission to access the notifications page."
        denial={denial}
      />
    );
  }

  const handleMarkAllRead = async () => {
    const unreadIds = items.filter((n) => !n.readAt && !n.archivedAt).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const results = await Promise.allSettled(unreadIds.map((id) => markRead.mutateAsync(id)));
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) toast.error(`${failed.length} notifications could not be marked.`);
    else toast.success("All marked as read.");
  };

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    if (audienceType === "USER" && !targetUserId.trim()) {
      toast.error("User ID is required for USER audience.");
      return;
    }

    setSending(true);
    try {
      const result = (await adminApi.createNotification({
        title: title.trim(),
        message: message.trim(),
        audienceType,
        audienceRole: audienceType === "ROLE" ? audienceRole : undefined,
        userId: audienceType === "USER" ? targetUserId.trim() : undefined,
        priority,
        kind: "admin.announcement",
      })) as { recipientCount: number };
      toast.success(`Broadcast sent to ${result.recipientCount} recipients.`);
      setTitle("");
      setMessage("");
    } catch (err) {
      toast.error("Failed to send broadcast.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Notifications"
        description="Operational notifications and broadcast announcements."
      >
        <TextButton
          disabled={
            items.filter((n) => !n.readAt && !n.archivedAt).length === 0 || markRead.isPending
          }
          onClick={handleMarkAllRead}
        >
          <CheckCheck className="size-3.5" />
          Mark all read
        </TextButton>
      </PageHeader>

      <Panel title="Send Broadcast">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--admin-faint)]">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--admin-faint)]">
              Message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--admin-faint)]">
              Audience
            </label>
            <Select
              value={audienceType}
              onValueChange={(v) => setAudienceType(v as typeof audienceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {audienceType === "ROLE" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--admin-faint)]">
                Role
              </label>
              <Select value={audienceRole} onValueChange={setAudienceRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {audienceType === "USER" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--admin-faint)]">
                User ID
              </label>
              <Input
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="e.g. u-admin"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--admin-faint)]">
              Priority
            </label>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end sm:col-span-2">
            <Button onClick={handleSendBroadcast} disabled={sending}>
              <Send className="mr-2 size-3.5" />
              {sending ? "Sending..." : "Send Broadcast"}
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Inbox">
        {isLoading ? (
          <div className="py-8 text-sm text-[var(--admin-faint)]">Loading...</div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No admin notifications"
            description="Backend notifications will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Bell className="size-3.5 text-[var(--admin-faint)]" />
                      {item.message}
                    </p>
                    {item.title ? (
                      <p className="text-[11px] text-[var(--admin-faint)]">{item.title}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.kind}</TableCell>
                  <TableCell>
                    <StatusPill status={item.readAt ? "ready" : "submitted"} />
                  </TableCell>
                  <TableCell className="text-xs text-[var(--admin-faint)]">
                    {formatDateTime(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
