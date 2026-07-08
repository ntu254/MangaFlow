import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, ASSISTANTS } from "@/shared/auth";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import type { ChapterCadence, ProductionSeries } from "@/entities/series/model/series-types";
import { CADENCE_LABEL } from "@/entities/series/model/series-types";
import { fromDateInputValue, toDateInputValue } from "@/shared/lib/format-date";
import { useCreateSeriesMutation } from "../../api/series-queries";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function PromoteDialog({
  proposal,
  open,
  onClose,
  existingSeries,
}: {
  proposal: SeriesProposal;
  open: boolean;
  onClose: () => void;
  existingSeries?: ProductionSeries;
}) {
  const user = useAuth((s) => s.user);
  const createSeriesMutation = useCreateSeriesMutation();
  const navigate = useNavigate();
  const [slug, setSlug] = useState(slugify(proposal.title));
  const [cadence, setCadence] = useState<ChapterCadence>("weekly");
  const [startDate, setStartDate] = useState(toDateInputValue(new Date().toISOString()));
  const [target, setTarget] = useState(proposal.chaptersPlanned);
  const [assistants, setAssistants] = useState<string[]>([]);

  if (existingSeries) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đã sản xuất</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Proposal này đã được khởi tạo thành series{" "}
            <span className="font-semibold">{existingSeries.title}</span>.
          </p>
          <DialogFooter>
            <button
              onClick={() => {
                navigate({
                  to: "/app/series/$slug/$tab",
                  params: { slug: existingSeries.slug, tab: "overview" },
                });
                onClose();
              }}
              className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
            >
              Mở series
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const submit = async () => {
    if (!user) return;
    if (!slug.trim()) {
      toast.error("Cần slug.");
      return;
    }
    try {
      const series = await createSeriesMutation.mutateAsync({
        slug: slug.trim(),
        title: proposal.title,
        synopsis: proposal.synopsis,
        genres: proposal.genres,
        coverUrl: proposal.coverUrl || "",
        coverFileKey: proposal.coverFileKey,
        cadence,
        startDate: fromDateInputValue(startDate),
        targetChapters: target,
        authorId: proposal.authorId,
        authorName: proposal.authorName,
        editorId: proposal.assignedEditorId ?? user.id,
        editorName: proposal.assignedEditorName ?? user.name,
        assistantIds: assistants,
        proposalId: proposal.id,
        status: "PLANNING",
      });
      toast.success("Đã khởi tạo sản xuất.");
      onClose();
      navigate({ to: "/app/series/$slug/$tab", params: { slug: series.slug, tab: "overview" } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Khởi tạo sản xuất — {proposal.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="pr-slug">Slug</Label>
            <Input id="pr-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pr-cad">Cadence</Label>
              <select
                id="pr-cad"
                value={cadence}
                onChange={(e) => setCadence(e.target.value as ChapterCadence)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                {(Object.keys(CADENCE_LABEL) as ChapterCadence[]).map((c) => (
                  <option key={c} value={c}>
                    {CADENCE_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pr-start">Ngày khởi động</Label>
              <Input
                id="pr-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pr-target">Target chapters</Label>
            <Input
              id="pr-target"
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <div>
            <Label>Assistants</Label>
            <div className="mt-1 space-y-1">
              {ASSISTANTS.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2 rounded border border-border bg-background px-3 py-1.5 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={assistants.includes(a.id)}
                    onChange={(e) =>
                      setAssistants((prev) =>
                        e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id),
                      )
                    }
                  />
                  <span>{a.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="rounded border border-border px-3 py-1.5 text-xs">
            Huỷ
          </button>
          <button
            onClick={submit}
            disabled={createSeriesMutation.isPending}
            className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
          >
            {createSeriesMutation.isPending ? "Dang tao..." : "Khoi tao"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
