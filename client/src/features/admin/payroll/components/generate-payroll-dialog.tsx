import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Calendar, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatJpy } from "../../_shared";

export function GeneratePayrollDialog({
  open,
  onOpenChange,
  isGenerating,
  onGenerate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGenerating: boolean;
  onGenerate: (data: {
    period: string;
    assistants: string[];
    onlyEditorApproved: boolean;
    excludeLinked: boolean;
  }) => void;
}) {
  const [period, setPeriod] = useState("2026-W27");
  const [scope, setScope] = useState("ALL");
  const [preview, setPreview] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = () => {
    if (preview && !showPreview) {
      // Show mock preview step
      setShowPreview(true);
      return;
    }

    // Execute generation
    onGenerate({
      period,
      assistants: scope === "ALL" ? [] : ["selected-id"],
      onlyEditorApproved: true,
      excludeLinked: true,
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setShowPreview(false);
      setPeriod("2026-W27");
      setScope("ALL");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 border-[var(--admin-border)] bg-[var(--admin-surface)] p-0">
        <DialogHeader className="border-b border-[var(--admin-border)] px-6 py-4">
          <DialogTitle className="text-[16px] font-semibold text-[var(--admin-ink)]">
            {showPreview ? "Preview Payroll Generation" : "Generate Payroll"}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--admin-muted)] mt-1">
            {showPreview
              ? "Review the estimated payouts before confirming."
              : "Compile approved tasks into new earning records."}
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="flex flex-col space-y-6 px-6 py-5">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[var(--admin-ink)] flex items-center gap-2">
                  <Calendar className="size-3.5 text-[var(--admin-faint)]" />
                  Payroll Period
                </Label>
                <Input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="e.g. 2026-W27"
                  className="h-9 rounded-[6px] border-[var(--admin-border)] text-[13px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[var(--admin-ink)] flex items-center gap-2">
                  <Users className="size-3.5 text-[var(--admin-faint)]" />
                  Assistant Scope
                </Label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger className="h-9 rounded-[6px] border-[var(--admin-border)] text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Active Assistants</SelectItem>
                    <SelectItem value="SPECIFIC">Specific Assistant...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-hover)]/30 p-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-[13px] font-medium text-[var(--admin-ink)]">
                    Only EDITOR_APPROVED Tasks
                  </Label>
                  <p className="text-[12px] text-[var(--admin-muted)]">
                    Ensures only tasks that have passed final review are paid.
                  </p>
                </div>
                <Switch checked={true} disabled />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-[13px] font-medium text-[var(--admin-ink)]">
                    Exclude Linked Items
                  </Label>
                  <p className="text-[12px] text-[var(--admin-muted)]">
                    Prevents double-paying tasks already attached to a previous earning.
                  </p>
                </div>
                <Switch checked={true} disabled />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[6px] border border-[var(--admin-border)] p-3">
              <Switch checked={preview} onCheckedChange={setPreview} id="preview-switch" />
              <Label
                htmlFor="preview-switch"
                className="text-[13px] font-medium text-[var(--admin-ink)] cursor-pointer"
              >
                Preview before generating
              </Label>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="rounded-[6px] border border-[var(--admin-border)] overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-hover)]">
                  <tr>
                    <th className="px-4 py-2 font-medium text-[var(--admin-faint)]">Assistant</th>
                    <th className="px-4 py-2 font-medium text-[var(--admin-faint)]">
                      Eligible Tasks
                    </th>
                    <th className="px-4 py-2 font-medium text-[var(--admin-faint)]">Excluded</th>
                    <th className="px-4 py-2 font-medium text-[var(--admin-faint)] text-right">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]/50 bg-[var(--admin-surface)]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[var(--admin-ink)]">Sato Kenji</td>
                    <td className="px-4 py-3 text-[var(--admin-muted)]">12</td>
                    <td className="px-4 py-3 text-[var(--admin-muted)]">0</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--admin-ink)]">
                      {formatJpy(184000)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[var(--admin-ink)]">Takahashi Mei</td>
                    <td className="px-4 py-3 text-[var(--admin-muted)]">8</td>
                    <td className="px-4 py-3 text-[var(--admin-muted)]">2</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--admin-ink)]">
                      {formatJpy(126000)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-start gap-2 text-[12px] text-amber-600 bg-amber-50 p-3 rounded-[6px] border border-amber-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <p>
                Takahashi Mei has 2 tasks excluded because they are already linked to previous
                payroll periods.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-hover)]/30 px-6 py-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating...
              </>
            ) : showPreview ? (
              "Confirm & Generate"
            ) : preview ? (
              "Review Generation"
            ) : (
              "Generate Now"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
