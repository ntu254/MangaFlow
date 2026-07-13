import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { SeparationOfDutiesWarning } from "@/entities/access";
import { ActionButton, PageHeader, StateBlock } from "@/shared/ui";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { mapAdminError, useDemoDataMutation } from "../../api/admin-queries";
import { PageShell, SettingRow, SettingsGroup } from "@/shared/layout/page-layout";
import { StatusPill } from "@/shared/ui/status-pill";
import { useAdminAccess, AccessDenied } from "../../_shared";
import { Database, FlaskConical, KeyRound, ServerCog, Shield } from "lucide-react";

const settings = [
  {
    label: "Live backend API",
    value: "http://localhost:3001/api",
    status: "ready",
    icon: ServerCog,
  },
  {
    label: "AI service bridge",
    value: "Express-only client boundary",
    status: "ready",
    icon: FlaskConical,
  },
  { label: "JWT refresh", value: "Access plus refresh tokens", status: "ready", icon: KeyRound },
  {
    label: "R2 signed URLs",
    value: "Metadata placeholder until upload slice",
    status: "submitted",
    icon: Shield,
  },
];

export function AdminSettingsPage() {
  const { denial } = useAdminAccess();
  const demoMutation = useDemoDataMutation();
  const [demoMode, setDemoMode] = useState<null | "reset" | "clear">(null);

  const runDemo = (mode: "reset" | "clear") => {
    demoMutation.mutate(mode, {
      onSuccess: () => {
        toast.success(
          mode === "reset"
            ? "Demo data reset successfully (user accounts were kept)."
            : "Demo data cleared successfully (user accounts were kept).",
        );
        setDemoMode(null);
      },
      onError: (err) => toast.error(mapAdminError(err)),
    });
  };

  if (denial) {
    return (
      <AccessDenied
        title="Settings"
        description="You do not have permission to access the admin settings page."
        denial={denial}
      />
    );
  }

  return (
    <PageShell maxWidth="6xl">
      <PageHeader
        title="Settings"
        description="Operational switches and integration boundaries. Environment secrets stay outside the repository and are never displayed."
      />

      <SeparationOfDutiesWarning>
        Settings here are non-secret previews. Credential rotation or third-party mutation requires
        explicit external approval.
      </SeparationOfDutiesWarning>

      <SettingsGroup title="Runtime boundaries">
        {settings.map((item) => (
          <SettingRow
            key={item.label}
            title={item.label}
            description={item.value}
            icon={<item.icon className="size-4 text-[var(--admin-faint)]" />}
            status={<StatusPill status={item.status} />}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup title="Feature flags">
        <StateBlock
          tone="warning"
          title="Read-only preview"
          description="Feature flag persistence is pending a backend model. These values show the current product contract and cannot be changed here."
        />
        <div className="space-y-3">
          {[
            "Use live backend for web login",
            "Route AI calls through Express",
            "Keep mobile /api compatibility aliases",
          ].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2"
            >
              <span className="text-sm font-medium">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-faint)]">
                  Preview
                </span>
                <Switch checked disabled aria-label={`${label} is enabled in preview mode`} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--admin-faint)]">
          Backend feature flag management is intentionally disabled until persistence, audit, and
          rollback semantics are implemented.
        </p>
      </SettingsGroup>

      <SettingsGroup title="Demo data">
        <StateBlock
          tone="warning"
          title="Reset / clear all demo data"
          description="Delete proposals, series, chapters, tasks, submissions, comments, notifications, rankings, and earnings while keeping user accounts so login still works. Reset recreates sample series for the flows; Clear only deletes data."
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ActionButton
            disabled={demoMutation.isPending}
            onClick={() => setDemoMode("reset")}
            className="inline-flex items-center gap-1.5"
          >
            <Database className="size-4" /> Reset demo data
          </ActionButton>
          <ActionButton
            tone="danger"
            disabled={demoMutation.isPending}
            onClick={() => setDemoMode("clear")}
          >
            Clear all data
          </ActionButton>
        </div>

        <ConfirmDialog
          open={demoMode !== null}
          onOpenChange={(open) => (!open ? setDemoMode(null) : undefined)}
          variant="danger"
          title={demoMode === "clear" ? "Delete all demo data?" : "Reset demo data?"}
          description={
            demoMode === "clear"
              ? "All business data will be deleted. User accounts will be kept."
              : "Current business data will be deleted and sample series will be recreated. User accounts will be kept."
          }
          impactExplanation="This action cannot be undone and applies to the entire demo database."
          confirmLabel={demoMode === "clear" ? "Delete data" : "Reset data"}
          isLoading={demoMutation.isPending}
          onConfirm={() => {
            if (demoMode) runDemo(demoMode);
          }}
        />
      </SettingsGroup>
    </PageShell>
  );
}
