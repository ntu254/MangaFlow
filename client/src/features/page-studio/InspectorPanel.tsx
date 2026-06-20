import { Sparkles, RefreshCw, Check, X, Layers, Brain } from "lucide-react";
import type { Region, AIResult } from "@/entities";
import { useStudioStore } from "./useStudioStore";

interface Props {
  regions: Region[];
  results: AIResult[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRunAI: () => void;
  aiAllowed: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  created: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "ai-suggested": "text-sky-400 bg-sky-400/10 border-sky-400/20",
  accepted: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  rejected: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
  "linked-to-task": "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

export function InspectorPanel({
  regions,
  results,
  onAccept,
  onReject,
  onRunAI,
  aiAllowed,
}: Props) {
  const { selectedRegionId, setSelectedRegionId } = useStudioStore();
  const selectedRegion = regions.find((r) => r.id === selectedRegionId);

  return (
    <div className="flex w-[280px] shrink-0 flex-col border-l border-border bg-background overflow-hidden">
      {/* ── AI action ─────────────────────────────── */}
      <div className="border-b border-border px-3 py-2.5">
        <button
          onClick={onRunAI}
          disabled={!aiAllowed}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-violet-600 px-3 py-2 text-[12px] font-semibold text-white shadow-lg shadow-sky-900/30 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Run AI Segmentation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0 divide-y divide-border">
        {/* ── Selected region detail ─────────────── */}
        {selectedRegion && (
          <section className="px-3 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30">
                Selected
              </span>
              <button
                onClick={() => setSelectedRegionId(null)}
                className="rounded p-0.5 text-foreground/30 hover:text-foreground/70"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-foreground/80 uppercase">
                  {selectedRegion.type}
                </span>
                <span
                  className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${STATUS_COLOR[selectedRegion.status] ?? ""}`}
                >
                  {selectedRegion.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-foreground/50 font-mono">
                <div>x: {selectedRegion.coords.x.toFixed(3)}</div>
                <div>y: {selectedRegion.coords.y.toFixed(3)}</div>
                <div>w: {selectedRegion.coords.w.toFixed(3)}</div>
                <div>h: {selectedRegion.coords.h.toFixed(3)}</div>
              </div>
              {selectedRegion.status === "ai-suggested" && (
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => onAccept(selectedRegion.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-600/20 border border-emerald-500/30 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-600/35 transition-colors"
                  >
                    <Check className="h-3 w-3" /> Accept
                  </button>
                  <button
                    onClick={() => onReject(selectedRegion.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md bg-foreground/5 border border-border py-1.5 text-[11px] font-semibold text-foreground/50 hover:bg-foreground/10 transition-colors"
                  >
                    <X className="h-3 w-3" /> Reject
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Regions list ───────────────────────── */}
        <section className="px-3 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-3 w-3 text-foreground/30" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30">
              Regions ({regions.length})
            </span>
          </div>
          <div className="space-y-1">
            {regions.length === 0 && (
              <div className="py-4 text-center text-[11px] text-foreground/25">
                No regions yet — run AI or draw manually.
              </div>
            )}
            {regions.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegionId(r.id === selectedRegionId ? null : r.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                  r.id === selectedRegionId
                    ? "bg-foreground/10 ring-1 ring-foreground/15"
                    : "hover:bg-foreground/[0.04]"
                }`}
              >
                <span className="font-mono text-[11px] font-semibold text-foreground/70 uppercase">
                  {r.type}
                </span>
                <span
                  className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${STATUS_COLOR[r.status] ?? ""}`}
                >
                  {r.status === "ai-suggested" ? "AI" : r.status}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── AI Results log ─────────────────────── */}
        <section className="px-3 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Brain className="h-3 w-3 text-foreground/30" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30">
              AI Runs ({results.length})
            </span>
          </div>
          {results.length === 0 && (
            <div className="py-4 text-center text-[11px] text-foreground/25">No AI runs yet.</div>
          )}
          {results.map((r) => (
            <div key={r.id} className="mb-1.5 rounded-lg border border-border bg-card p-2.5">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase ${
                    r.status === "completed"
                      ? "text-emerald-400"
                      : r.status === "failed"
                        ? "text-rose-400"
                        : "text-amber-400"
                  }`}
                >
                  {r.status}
                </span>
                <span className="text-[10px] text-foreground/30">{r.at}</span>
              </div>
              <div className="mt-1 text-[10px] text-foreground/40">
                {r.suggestionsCount} suggestions · {r.acceptedCount} accepted
              </div>
              {r.status === "failed" && (
                <button className="mt-1 flex items-center gap-1 text-[10px] text-sky-400 hover:underline">
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
