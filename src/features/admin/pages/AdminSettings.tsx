import { adminSettingsService } from "@/features/admin/services/admin-settings.service";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Key, Save, Shield, Wrench } from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [toggles, setToggles] = useState<{ key: string; enabled: boolean }[]>([]);
  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [editTemplateName, setEditTemplateName] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [apiConnectName, setApiConnectName] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [editRole, setEditRole] = useState<{ role: string; users: number; access: string } | null>(null);
  const [rolePermissions, setRolePermissions] = useState("read");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminSettingsService.getData(),
  });

  useEffect(() => {
    if (data) {
      setToggles(data.onboardingToggles.map((t) => ({ key: t.key, enabled: t.enabled })));
      setPlatformName(data.platformInfo.platformName);
      setSupportEmail(data.platformInfo.supportEmail);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      adminSettingsService.saveGeneral(
        { platformName, supportEmail },
        toggles,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div><h1 className="text-2xl font-semibold text-foreground font-body">Settings</h1><p className="text-sm text-muted-foreground font-body mt-1 animate-pulse">Loading...</p></div>
        <div className="h-96 bg-card border border-border rounded-lg animate-pulse" />
      </div>
    );
  }

  const toggleSwitch = (key: string) =>
    setToggles((prev) => prev.map((t) => (t.key === key ? { ...t, enabled: !t.enabled } : t)));

  return (
    <>
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-body">Settings</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Manage platform configuration</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="general" className="font-body text-xs">General</TabsTrigger>
          <TabsTrigger value="categories" className="font-body text-xs">Categories</TabsTrigger>
          <TabsTrigger value="notifications" className="font-body text-xs">Notifications</TabsTrigger>
          <TabsTrigger value="api" className="font-body text-xs">API & Integrations</TabsTrigger>
          <TabsTrigger value="permissions" className="font-body text-xs">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold font-body mb-4">Onboarding Options</h3>
              <div className="space-y-4">
                {data?.onboardingToggles.map((t) => {
                  const local = toggles.find((x) => x.key === t.key);
                  return (
                    <div key={t.key} className="flex items-center justify-between">
                      <div>
                        <Label className="font-body text-sm">{t.label}</Label>
                        <p className="text-xs text-muted-foreground font-body">{t.description}</p>
                      </div>
                      <Switch checked={local?.enabled ?? t.enabled} onCheckedChange={() => toggleSwitch(t.key)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold font-body mb-4">Platform</h3>
              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label className="font-body text-sm">Platform Name</Label>
                  <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="font-body text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Support Email</Label>
                  <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="font-body text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => saveMutation.mutate()}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold font-body mb-4">Style Categories</h3>
              <div className="flex flex-wrap gap-2">
                {data?.styleCategories.map((s) => (
                  <span key={s} className="px-3 py-1.5 bg-muted text-sm font-body rounded-md text-foreground">{s}</span>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold font-body mb-4">Occasion Categories</h3>
              <div className="flex flex-wrap gap-2">
                {data?.occasionCategories.map((o) => (
                  <span key={o} className="px-3 py-1.5 bg-muted text-sm font-body rounded-md text-foreground">{o}</span>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold font-body mb-4">Color Palette Sets</h3>
              <div className="flex gap-3">
                {data?.colorPalette.map((c) => (
                  <div key={c} className="h-8 w-8 rounded-md border border-border" style={{ background: c }} title={c} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold font-body mb-2">Notification Templates</h3>
            {data?.notificationTemplates.map((t) => (
              <div key={t} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium font-body">{t}</p>
                  <p className="text-xs text-muted-foreground font-body">Last edited 3 days ago</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setEditTemplateName(t); setTemplateContent(""); }}>Edit Template</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold font-body mb-2">API Integrations</h3>
            {data?.apiIntegrations.map((api) => (
              <div key={api.name} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${api.status === "Connected" ? "bg-teal" : "bg-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium font-body">{api.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{api.status}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setApiConnectName(api.name); setApiKey(""); }}>{api.status === "Connected" ? "Configure" : "Connect"}</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold font-body mb-2">Admin Permissions</h3>
            {data?.roles.map((r) => (
              <div key={r.role} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium font-body">{r.role}</p>
                  <p className="text-xs text-muted-foreground font-body">{r.access}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-body">{r.users} user{r.users > 1 ? "s" : ""}</span>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => { setEditRole({ role: r.role, users: r.users, access: r.access }); setRolePermissions("read"); }}>Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>

      <Dialog open={!!editTemplateName} onOpenChange={(v) => { if (!v) setEditTemplateName(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Template: {editTemplateName}</DialogTitle>
            <DialogDescription className="srOnly">Edit notification template content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">Template Content</Label>
              <textarea value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} rows={6} className="w-full px-3 py-2 rounded-md border border-border bg-background font-body text-sm resize-none" placeholder="Enter template content with placeholders like {{name}}, {{email}}..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditTemplateName(null)}>Cancel</Button>
            <Button size="sm" onClick={() => setEditTemplateName(null)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!apiConnectName} onOpenChange={(v) => { if (!v) { setApiConnectName(null); setApiKey(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{apiConnectName}</DialogTitle>
            <DialogDescription className="srOnly">Configure API integration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border rounded-md">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-body text-muted-foreground">Enter your API key to connect to {apiConnectName}</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-foreground">API Key</Label>
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="sk-..." className="h-9 font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setApiConnectName(null); setApiKey(""); }}>Cancel</Button>
            <Button size="sm" disabled={!apiKey} onClick={() => { setApiConnectName(null); setApiKey(""); }}>Connect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRole} onOpenChange={(v) => { if (!v) setEditRole(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role: {editRole?.role}</DialogTitle>
            <DialogDescription className="srOnly">Edit admin role permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm font-body text-muted-foreground mb-2">
              <Shield className="h-4 w-4" />
              <span>{editRole?.users} user{editRole?.users !== 1 ? "s" : ""} with this role</span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-body text-foreground">Module Access Level</Label>
              <div className="flex gap-2">
                {["read", "write", "admin"].map((lvl) => (
                  <Button key={lvl} variant={rolePermissions === lvl ? "default" : "outline"} size="sm" className="text-xs capitalize" onClick={() => setRolePermissions(lvl)}>
                    {lvl}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-body">Current access: {editRole?.access}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditRole(null)}>Cancel</Button>
            <Button size="sm" onClick={() => setEditRole(null)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
