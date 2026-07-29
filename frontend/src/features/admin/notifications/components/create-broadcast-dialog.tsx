import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/shared/api/services";
import { mapAdminError } from "../../_shared";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "MANGAKA", label: "Mangaka" },
  { value: "ASSISTANT", label: "Assistant" },
  { value: "BOARD", label: "Board" },
] as const;

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "All users" },
  { value: "ROLE", label: "By role" },
  { value: "USER", label: "Specific user" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
] as const;

export function CreateBroadcastDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState<"ALL" | "ROLE" | "USER">("ALL");
  const [audienceRole, setAudienceRole] = useState("EDITOR");
  const [targetUserId, setTargetUserId] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH">("NORMAL");
  const [sending, setSending] = useState(false);

  const reset = () => {
    setTitle("");
    setMessage("");
    setAudienceType("ALL");
    setAudienceRole("EDITOR");
    setTargetUserId("");
    setPriority("NORMAL");
  };

  const close = () => {
    if (sending) return;
    reset();
    onOpenChange(false);
  };

  const submit = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    if (audienceType === "USER" && !targetUserId.trim()) {
      toast.error("User ID is required for a specific-user broadcast.");
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
      reset();
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(mapAdminError(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-xl border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[22px] text-[var(--admin-ink)]">
            New broadcast
          </DialogTitle>
          <DialogDescription>
            Send one operational message to a defined audience. Sent broadcasts are immutable.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
          </Field>
          <Field label="Message" className="sm:col-span-2">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
            />
          </Field>
          <Field label="Audience">
            <Select
              value={audienceType}
              onValueChange={(value) => setAudienceType(value as typeof audienceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {audienceType === "ROLE" ? (
            <Field label="Role">
              <Select value={audienceRole} onValueChange={setAudienceRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : audienceType === "USER" ? (
            <Field label="User ID">
              <Input
                value={targetUserId}
                onChange={(event) => setTargetUserId(event.target.value)}
                placeholder="e.g. u-admin"
              />
            </Field>
          ) : (
            <Field label="Priority">
              <PrioritySelect value={priority} onValueChange={setPriority} />
            </Field>
          )}
          {audienceType !== "ALL" ? (
            <Field label="Priority">
              <PrioritySelect value={priority} onValueChange={setPriority} />
            </Field>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={sending}>
            <Send className="mr-2 size-3.5" />
            {sending ? "Sending..." : "Send broadcast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrioritySelect({
  value,
  onValueChange,
}: {
  value: "LOW" | "NORMAL" | "HIGH";
  onValueChange: (value: "LOW" | "NORMAL" | "HIGH") => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as typeof value)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRIORITY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-faint)]">
        {label}
      </span>
      {children}
    </label>
  );
}
