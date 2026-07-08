import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { User } from "@/shared/auth";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ProposalWizard } from "../../create/components/proposal-wizard";

export function ResubmitDialog({
  proposal,
  user: _user,
  open,
  onClose,
  onResubmit,
}: {
  proposal: SeriesProposal;
  user: User;
  open: boolean;
  onClose: () => void;
  onResubmit?: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  const openChange = useMemo(
    () => [...proposal.requestedChanges].reverse().find((change) => !change.resolvedAt),
    [proposal.requestedChanges],
  );
  const [comment, setComment] = useState("");
  const [resolved, setResolved] = useState<
    Record<string, { resolved: boolean; response?: string }>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const setItem = (id: string, patch: Partial<{ resolved: boolean; response?: string }>) => {
    setResolved((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { resolved: false }), ...patch },
    }));
  };

  const submit = async (values: Record<string, unknown>) => {
    if (!openChange) {
      toast.error("Không có yêu cầu chỉnh sửa nào đang mở.");
      return;
    }
    const missing = openChange.items.filter((item) => !resolved[item.id]?.resolved);
    if (missing.length > 0) {
      toast.error(`Còn ${missing.length} điểm chưa đánh dấu giải quyết.`);
      return;
    }

    setSubmitting(true);
    try {
      await onResubmit?.({
        ...values,
        resolvedItems: resolved,
        comment: comment.trim() || values.submissionNote || undefined,
      });
      toast.success("Đã lưu đầy đủ thay đổi và resubmit cho Editor.");
      onClose();
      setResolved({});
      setComment("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi resubmit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đầy đủ và resubmit proposal</DialogTitle>
        </DialogHeader>

        {openChange ? (
          <section className="rounded border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-900">
              Checklist từ Editor — {openChange.editorName}
            </p>
            <ul className="mt-3 space-y-2">
              {openChange.items.map((item) => {
                const state = resolved[item.id] ?? { resolved: false };
                return (
                  <li
                    key={item.id}
                    className="rounded border border-border bg-background p-3 text-xs"
                  >
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={state.resolved}
                        onChange={(event) => setItem(item.id, { resolved: event.target.checked })}
                        className="mt-0.5"
                      />
                      <span className="flex-1">{item.text}</span>
                    </label>
                    <Textarea
                      rows={2}
                      className="mt-2 text-xs"
                      placeholder="Bạn đã chỉnh sửa điểm này như thế nào…"
                      value={state.response ?? ""}
                      onChange={(event) => setItem(item.id, { response: event.target.value })}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <p className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground">
            Không tìm thấy checklist revision đang mở.
          </p>
        )}

        <div className="space-y-1.5">
          <Label>Ghi chú phiên bản sửa đổi</Label>
          <Textarea
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Tóm tắt các thay đổi chính…"
          />
        </div>

        <ProposalWizard
          mode="edit"
          initialProposal={proposal}
          submitLabel={submitting ? "Đang resubmit…" : "Lưu thay đổi & resubmit"}
          onCancel={onClose}
          onSave={async (values) => {
            if (!submitting) await submit(values);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
