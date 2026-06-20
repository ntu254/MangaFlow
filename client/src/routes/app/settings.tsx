import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import {
  getAiBaseUrl,
  setAiBaseUrl,
  DEFAULT_AI_URL,
} from "@/features/ai-bubble/api/bubble-service";
import { useState } from "react";

export const Route = createFileRoute("/app/settings")({
  component: () => {
    const [url, setUrl] = useState(getAiBaseUrl());
    const [saved, setSaved] = useState(false);
    return (
      <div>
        <PageHeader title="Settings" jp="設定" description="Workspace preferences." />
        <div className="max-w-xl space-y-6">
          <section className="rounded-md border border-foreground/10 bg-card p-4">
            <h2 className="text-[13px] font-semibold">AI bubble service</h2>
            <p className="mt-1 text-[12px] text-foreground/55">
              Default: <code>{DEFAULT_AI_URL}</code>. The browser calls this URL directly; the
              service must allow CORS from this origin.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-9 flex-1 rounded-md border border-foreground/15 bg-foreground/5 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={() => {
                  setAiBaseUrl(url);
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1500);
                }}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Save
              </button>
            </div>
            {saved && (
              <div className="mt-2 text-[12px] text-emerald-600 dark:text-emerald-400">Saved.</div>
            )}
          </section>
        </div>
      </div>
    );
  },
});
