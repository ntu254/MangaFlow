import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ScanSearch, Eraser } from "lucide-react";

export type AiTabContentProps = {
  aiDetecting: boolean;
  aiProcessing: boolean;
  handleAIDetect: () => Promise<void>;
  handleAIProcess: () => Promise<void>;
  aiError: string | null;
  aiResult: { detectCount?: number; processedUrl?: string } | null;
};

export function AiTabContent({
  aiDetecting,
  aiProcessing,
  handleAIDetect,
  handleAIProcess,
  aiError,
  aiResult
}: AiTabContentProps) {
  return (
    <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
      <div className="flex items-start gap-3 mb-2">
        <div className="rounded-lg bg-[#f8f1ff] p-2 text-[#9065d5] shrink-0">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-[#2f243a]">AI Bubble Tools</h2>
          <p className="mt-0.5 text-[10px] leading-normal text-muted-foreground">
            Auto-detect speech bubbles and whiten them using AI.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Button
          id="btn-ai-detect"
          className="w-full justify-start gap-2 h-9 text-xs"
          variant="outline"
          onClick={() => void handleAIDetect()}
          disabled={aiDetecting || aiProcessing}
        >
          {aiDetecting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ScanSearch className="size-4" />
          )}
          {aiDetecting ? "Detecting bubbles…" : "Detect Bubbles"}
        </Button>

        <Button
          id="btn-ai-process"
          className="w-full justify-start gap-2 h-9 text-xs bg-[#9065d5] text-white hover:bg-[#7f55c7]"
          onClick={() => void handleAIProcess()}
          disabled={aiDetecting || aiProcessing}
        >
          {aiProcessing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Eraser className="size-4" />
          )}
          {aiProcessing ? "Whitening bubbles…" : "Whiten Bubbles"}
        </Button>
      </div>

      {aiError && (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          {aiError}
        </div>
      )}

      {aiResult && !aiError && (
        <div className="mt-2 rounded-md border border-[#eadff6] bg-[#f8f1ff] p-2.5 text-xs text-[#2f243a] space-y-1">
          {aiResult.detectCount !== undefined && (
            <p>✓ Detected <strong>{aiResult.detectCount}</strong> bubble region{aiResult.detectCount !== 1 ? "s" : ""}.</p>
          )}
          {aiResult.processedUrl && (
            <p>✓ Processed image ready — canvas updated.</p>
          )}
        </div>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground leading-normal">
        <strong>Detect</strong> scans the page and saves bubble regions (source: AI).<br />
        <strong>Whiten</strong> applies inpainting to produce a clean processed image.
      </p>
    </section>
  );
}
