import { adminNotificationsService } from "@/features/admin/services/admin-notifications.service";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/shared/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Eye,
  Mail,
  Megaphone,
  MessageSquare,
  Save,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminNotifications() {
  const [sendTitle, setSendTitle] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [target, setTarget] = useState("all");
  const [emailSettings, setEmailSettings] = useState<{ key: string; enabled: boolean }[]>([]);
  const [pushSettings, setPushSettings] = useState<{ key: string; enabled: boolean }[]>([]);
  const [editTemplate, setEditTemplate] = useState<{ id: string; name: string; channel: string; trigger: string; status: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => adminNotificationsService.getData(),
  });

  useEffect(() => {
    if (data) {
      setEmailSettings(data.emailSettings.map((s) => ({ key: s.key, enabled: s.enabled })));
      setPushSettings(data.pushSettings.map((s) => ({ key: s.key, enabled: s.enabled })));
    }
  }, [data]);

  const sendMutation = useMutation({
    mutationFn: () => adminNotificationsService.sendBroadcast({ target, title: sendTitle, body: sendBody }),
    onSuccess: () => { setSendTitle(""); setSendBody(""); setTarget("all"); },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      adminNotificationsService.saveSettings([
        ...emailSettings.map((s) => ({ ...s, label: "", description: "" })),
        ...pushSettings.map((s) => ({ ...s, label: "", description: "" })),
      ]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
  });

  if (isLoading || !data) {
    if (!data && !isLoading) {
      return (
        <div className="space-y-8 max-w-7xl">
          <div><h1 className="text-2xl font-semibold text-foreground font-body">Notifications</h1><p className="text-sm text-muted-foreground font-body mt-1">Failed to load data</p></div>
        </div>
      );
    }
    return (
      <div className="space-y-8 max-w-7xl">
        <div><h1 className="text-2xl font-semibold text-foreground font-body">Notifications</h1><p className="text-sm text-muted-foreground font-body mt-1 animate-pulse">Loading...</p></div>
        <div className="h-64 bg-card border border-border rounded-lg animate-pulse" />
      </div>
    );
  }

  const toggleEmail = (key: string) =>
    setEmailSettings((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s));
  const togglePush = (key: string) =>
    setPushSettings((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s));

  return (
    <>
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">Thông Báo</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Quản lý mẫu thông báo và gửi phát sóng đến người dùng</p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="templates" className="font-body text-xs gap-1.5"><Bell className="h-3.5 w-3.5" /> Mẫu thông báo</TabsTrigger>
          <TabsTrigger value="broadcast" className="font-body text-xs gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Gửi phát sóng</TabsTrigger>
          <TabsTrigger value="settings" className="font-body text-xs gap-1.5"><Mail className="h-3.5 w-3.5" /> Cài đặt kênh</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Mẫu</TableHead>
                  <TableHead className="font-body">Kênh</TableHead>
                  <TableHead className="font-body">Kích hoạt bởi</TableHead>
                  <TableHead className="font-body">Trạng thái</TableHead>
                  <TableHead className="font-body w-24">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm font-medium font-body">{t.name}</TableCell>
                    <TableCell className="text-sm font-body text-muted-foreground">{t.channel}</TableCell>
                    <TableCell className="text-sm font-body text-muted-foreground font-mono">{t.trigger}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-body ${
                        t.status === "Active" ? "bg-teal-light text-teal" :
                        t.status === "Draft" ? "bg-muted text-muted-foreground" :
                        "bg-red-50 text-destructive"
                      }`}>
                        {t.status}
                      </span>
                    </TableCell>
                    <TableCell>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setEditTemplate({ id: t.id, name: t.name, channel: t.channel, trigger: t.trigger, status: t.status })}>
                        Chỉnh sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                )) ?? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-sm text-muted-foreground font-body">No templates</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="broadcast" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl space-y-5">
            <div>
              <h3 className="text-sm font-semibold font-body mb-4">Soạn thông báo</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm">Nhóm đối tượng</Label>
                  <div className="flex gap-2">
                    {[("all"), ("premium"), ("free"), ("active")].map((t) => (
                      <Button key={t} variant={target === t ? "default" : "outline"} size="sm" className="text-xs capitalize" onClick={() => setTarget(t)}>
                        {t === "all" ? "Tất cả" : t === "premium" ? "Premium" : t === "free" ? "Miễn phí" : "Đang hoạt động"}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Tiêu đề</Label>
                  <Input value={sendTitle} onChange={(e) => setSendTitle(e.target.value)} placeholder="Tiêu đề thông báo..." className="font-body text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Nội dung</Label>
                  <Textarea value={sendBody} onChange={(e) => setSendBody(e.target.value)} placeholder="Viết nội dung thông báo..." className="font-body text-sm min-h-[100px]" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Sẽ gửi qua push notification và email digest
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowPreview(true)}>Xem trước</Button>
                  <Button size="sm" className="gap-1.5 text-xs" onClick={() => sendMutation.mutate()} disabled={!sendTitle || !sendBody}>
                    <Send className="h-3.5 w-3.5" /> Gửi phát sóng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl space-y-6">
            <div>
              <h3 className="text-sm font-semibold font-body mb-4">Cài đặt Email</h3>
              <div className="space-y-4">
                {data?.emailSettings.map((s) => {
                  const local = emailSettings.find((e) => e.key === s.key);
                  return (
                    <div key={s.key} className="flex items-center justify-between">
                      <div>
                        <Label className="font-body text-sm">{s.label}</Label>
                        <p className="text-xs text-muted-foreground font-body">{s.description}</p>
                      </div>
                      <Switch checked={local?.enabled ?? s.enabled} onCheckedChange={() => toggleEmail(s.key)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold font-body mb-4">Cài đặt Push Notification</h3>
              <div className="space-y-4">
                {data?.pushSettings.map((s) => {
                  const local = pushSettings.find((e) => e.key === s.key);
                  return (
                    <div key={s.key} className="flex items-center justify-between">
                      <div>
                        <Label className="font-body text-sm">{s.label}</Label>
                        <p className="text-xs text-muted-foreground font-body">{s.description}</p>
                      </div>
                      <Switch checked={local?.enabled ?? s.enabled} onCheckedChange={() => togglePush(s.key)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="gap-2 text-xs" onClick={() => saveMutation.mutate()}>
                <Save className="h-3.5 w-3.5" /> Lưu cài đặt
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>

      <Dialog open={!!editTemplate} onOpenChange={(v) => { if (!v) setEditTemplate(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Template: {editTemplate?.name}</DialogTitle>
            <DialogDescription className="srOnly">Edit notification template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Template Name</Label>
              <Input value={editTemplate?.name ?? ""} readOnly className="h-9 font-body text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-foreground">Channel</Label>
                <Input value={editTemplate?.channel ?? ""} readOnly className="h-9 font-body text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-foreground">Trigger</Label>
                <Input value={editTemplate?.trigger ?? ""} readOnly className="h-9 font-body text-sm font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Status</Label>
              <select className="w-full h-10 px-3 rounded-md border border-border bg-background font-body text-sm">
                <option value="Active" selected={editTemplate?.status === "Active"}>Active</option>
                <option value="Draft" selected={editTemplate?.status === "Draft"}>Draft</option>
                <option value="Paused" selected={editTemplate?.status === "Paused"}>Paused</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground font-body">Template body editing coming soon. Use the notification templates section in settings for full content customization.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditTemplate(null)}>Close</Button>
            <Button size="sm" onClick={() => setEditTemplate(null)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Broadcast Preview</DialogTitle>
            <DialogDescription className="srOnly">Preview broadcast notification</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">Push Notification</span>
              </div>
              <p className="text-sm font-semibold font-body">{sendTitle || "Notification Title"}</p>
              <p className="text-sm text-muted-foreground font-body mt-1">{sendBody || "Notification message body will appear here."}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">Email Digest</span>
              </div>
              <p className="text-sm font-semibold font-body">{sendTitle || "Email Subject"}</p>
              <p className="text-sm text-muted-foreground font-body mt-1">{sendBody || "Email body content will be sent as digest."}</p>
            </div>
            <p className="text-xs text-muted-foreground font-body">Target: <span className="font-medium text-foreground">{target === "all" ? "All Users" : target}</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
