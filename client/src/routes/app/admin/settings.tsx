import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";
import { PageHeader, StatCard } from "@/layouts/AppShell";
import {
  DEFAULT_AI_URL,
  getAiBaseUrl,
  setAiBaseUrl,
} from "@/features/ai-bubble/api/bubble-service";

export const Route = createFileRoute("/app/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [url, setUrl] = useState(getAiBaseUrl());
  const [sessionMinutes, setSessionMinutes] = useState("60");
  const [saved, setSaved] = useState(false);

  function saveSettings() {
    setAiBaseUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="admin-console admin-page space-y-5">
      <PageHeader
        title="Settings"
        jp="System config"
        description="View system config, update config, and save settings."
        actions={
          <button
            onClick={saveSettings}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
          >
            <Save className="h-3.5 w-3.5" />
            Save settings
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Auth policy" value={`${sessionMinutes} min`} hint="Admin session window" />
        <StatCard label="AI service" value={url ? "Configured" : "Missing"} />
        <StatCard label="Storage provider" value="R2" hint="Configured by server env" />
      </div>

      <section className="max-w-2xl rounded-md border border-foreground/10 bg-card p-4">
        <h2 className="text-sm font-semibold">System config</h2>
        <div className="mt-4 space-y-4">
          <Field label="AI bubble service URL">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={DEFAULT_AI_URL}
              className="input"
            />
          </Field>
          <Field label="Admin session minutes">
            <input
              type="number"
              min={15}
              value={sessionMinutes}
              onChange={(event) => setSessionMinutes(event.target.value)}
              className="input"
            />
          </Field>
        </div>
        {saved && (
          <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">Settings saved.</div>
        )}
      </section>

      <style>{`
        .input {
          height: 36px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid rgba(127, 127, 127, 0.22);
          background: rgba(127, 127, 127, 0.05);
          padding: 0 10px;
          font-size: 13px;
          outline: none;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-foreground/60">{label}</span>
      {children}
    </label>
  );
}
