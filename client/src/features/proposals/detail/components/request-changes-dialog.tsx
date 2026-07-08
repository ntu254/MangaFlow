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
      toast.error("Cần ít nhất 1 điểm yêu cầu chỉnh sửa.");
      return;
    }
    const text = (summary.trim() ? `${summary.trim()}\n` : "") + clean.join("\n");
    setSubmitting(true);
    try {
      await onRequestChanges?.({ comment: text });
      toast.success(`Đã gửi ${clean.length} điểm cần chỉnh sửa.`);
      onClose();
      setItems([""]);
      setSummary("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Yêu cầu chỉnh sửa proposal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tóm tắt chung (tuỳ chọn)
            </Label>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Nhận xét chung cho tác giả…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Checklist các điểm cần chỉnh sửa
            </Label>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-2 text-[10px] font-bold text-muted-foreground">{i + 1}.</span>
                  <Input
                    value={it}
                    onChange={(e) => setItem(i, e.target.value)}
                    placeholder="Vd: Mở rộng đoạn giới thiệu nhân vật chính ở trang 3."
                  />
                  {items.length > 1 ? (
                    <button
                      onClick={() => remove(i)}
                      className="rounded px-2 text-xs text-rose-700 hover:underline"
                    >
                      Xoá
                    </button>
                  ) : null}
                </div>
              ))}
              <button onClick={add} className="text-xs text-foreground/70 hover:underline">
                + Thêm điểm
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
            Huỷ
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu chỉnh sửa"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
