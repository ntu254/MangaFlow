import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useEditorDecisionHistory } from "@/shared/queries/useEditorReview";
import {
  EditorEmpty,
  EditorInlineLoading,
  EditorPanel,
  EditorPill,
  EditorShell,
} from "@/features/editor/components/EditorWorkspace";

export const Route = createFileRoute("/app/editor/decision-history")({
  component: DecisionHistoryPage,
});

function DecisionHistoryPage() {
  const { data = [], isLoading } = useEditorDecisionHistory();

  return (
    <EditorShell
      title="Decision history"
      description="Read-only Board decisions related to your managed series. Sensitive audit and system payloads are not shown."
    >
      <EditorPanel
        title="Decision ledger"
        description="Series approval and cancellation-review decisions."
      >
        {isLoading ? (
          <EditorInlineLoading label="Loading decision history..." />
        ) : data.length === 0 ? (
          <EditorEmpty
            title="No decisions yet"
            hint="Board decisions for managed series will appear here."
          />
        ) : (
          <div className="divide-y divide-border">
            {data.map((item) => (
              <article key={`${item.type}-${item.id}`} className="flex items-start gap-3 px-4 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground/5">
                  <History className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{item.seriesTitle}</h2>
                    <EditorPill>{item.type}</EditorPill>
                    <EditorPill
                      tone={
                        item.result === "APPROVED" || item.result === "CONTINUE"
                          ? "success"
                          : "warn"
                      }
                    >
                      {item.result}
                    </EditorPill>
                  </div>
                  {item.detail && (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                  )}
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {item.actor ? `${item.actor} · ` : ""}
                    {item.decidedAt ? new Date(item.decidedAt).toLocaleString() : "No date"}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </EditorPanel>
    </EditorShell>
  );
}
