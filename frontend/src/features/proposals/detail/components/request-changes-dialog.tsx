import { useState } from "react";
import { toast } from "sonner";
import type { User } from "@/shared/auth";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RequestChangesDialog({
  proposal,
  user,
  open,
  onClose,
  onRequestChanges,
}: {
  proposal: SeriesProposal;
  user: User;
  open: boolean;
  onClose: () => void;
  onRequestChanges?: (payload: { comment: string }) => Promise<unknown> | unknown;
}) {
  const [items, setItems] = useState<string[]>([""]);
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setItem = (i: number, v: string) => setItems((arr) => arr.map((x, j) => (j === i ? v : x)));
  const add = () => setItems((arr) => [...arr, ""]);
  const remove = (i: number) => setItems((arr) => arr.filter((_, j) => j !== i));

  const submit = async () => {
    const clean = items.map((s) => s.trim()).filter(Boolean);
    if (clean.length === 0) {
      toast.error("At least 1 revision item is required.");
      return;
    }
    const text = (summary.trim() ? `${summary.trim()}\n` : "") + clean.join("\n");
    setSubmitting(true);
    try {
      await onRequestChanges?.({ comment: text });
      toast.success(`Sent ${clean.length} revision item(s).`);
      onClose();
      setItems([""]);
      setSummary("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Request changes on proposal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              General summary (optional)
            </Label>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="General comments for the author..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Revision checklist items
            </Label>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-2 text-[10px] font-bold text-muted-foreground">{i + 1}.</span>
                  <Input
                    value={it}
                    onChange={(e) => setItem(i, e.target.value)}
                    placeholder="E.g.: Expand the main character introduction on page 3."
                  />
                  {items.length > 1 ? (
                    <button
                      onClick={() => remove(i)}
                      className="rounded px-2 text-xs text-rose-700 hover:underline"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
              <button onClick={add} className="text-xs text-foreground/70 hover:underline">
                + Add item
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit change request"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
