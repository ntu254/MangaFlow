import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { User } from "@/shared/auth";
import { useCreateVotingSessionMutation } from "../../api/board-queries";
import { useProposalsQuery } from "@/features/proposals";
import type { VotingSession, VotingSessionMode } from "@/entities/board/model/voting-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { fromDateInputValue, toDateInputValue } from "@/shared/lib/format-date";
import { ResolvedImage } from "@/shared/ui";

export function SessionForm({
  user: _user,
  onCreated,
}: {
  user: User;
  onCreated: (s: VotingSession) => void;
}) {
  const { data: proposals = [], isLoading: isLoadingProposals } = useProposalsQuery({
    status: "PENDING_BOARD,TIE_BREAK",
  });
  const createSessionMutation = useCreateVotingSessionMutation();
  const [mode, setMode] = useState<VotingSessionMode>("SCHEDULED");
  const [title, setTitle] = useState("Board meeting");
  const [scheduledFor, setScheduledFor] = useState(
    toDateInputValue(new Date(Date.now() + 48 * 3600_000).toISOString()),
  );
  const [closesAt, setClosesAt] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const eligible = useMemo(
    () => proposals.filter((p) => p.status === "PENDING_BOARD" || p.status === "TIE_BREAK"),
    [proposals],
  );

  const toggle = (id: string) => {
    if (mode === "AD_HOC") {
      setSelected([id]);
      return;
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async () => {
    try {
      const session = await createSessionMutation.mutateAsync({
        title: title.trim() || (mode === "AD_HOC" ? "Ad-hoc session" : "Board meeting"),
        mode,
        proposalIds: selected,
        scheduledFor: mode === "SCHEDULED" ? fromDateInputValue(scheduledFor) : undefined,
        closesAt: closesAt ? fromDateInputValue(closesAt) : undefined,
      });
      toast.success("Session created.");
      onCreated(session);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error.");
    }
  };

  return (
    <div className="space-y-5 rounded-lg border border-border bg-card/40 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="mode"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Mode
          </Label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => {
              const m = e.target.value as unknown as VotingSessionMode;
              setMode(m);
              if (m === "AD_HOC") setSelected((prev) => prev.slice(0, 1));
            }}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="SCHEDULED">Lich hop - nhieu proposal</option>
            <option value="AD_HOC">Ad-hoc - 1 proposal, vote ngay</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="title"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Title
          </Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {mode === "SCHEDULED" ? (
          <div className="space-y-1.5">
            <Label
              htmlFor="sched"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Scheduled meeting
            </Label>
            <Input
              id="sched"
              type="date"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label
            htmlFor="closes"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Expected close (optional)
          </Label>
          <Input
            id="closes"
            type="date"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Select proposals ({selected.length}
          {mode === "AD_HOC" ? "/1" : ""})
        </p>
        {isLoadingProposals ? (
          <p className="rounded border border-dashed border-border p-4 text-xs text-muted-foreground">
            Loading proposals...
          </p>
        ) : eligible.length === 0 ? (
          <p className="rounded border border-dashed border-border p-4 text-xs text-muted-foreground">
            Hien khong co proposal nao dang for Board review hoac can tie-break.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {eligible.map((p) => {
              const active = selected.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`flex w-full items-start gap-2 rounded border p-2 text-left text-xs ${
                      active
                        ? "border-foreground bg-foreground/5"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <ResolvedImage
                      fileKey={p.coverFileKey}
                      fallbackUrl={p.coverUrl}
                      alt=""
                      className="h-12 w-9 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {p.authorName} - {formatProposalStatus(p.status)} - {(p.votes ?? []).length}
                        /5
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={selected.length === 0 || createSessionMutation.isPending}
          className="rounded bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
        >
          Create session
        </button>
      </div>
    </div>
  );
}

function formatProposalStatus(status: string) {
  switch (status) {
    case "PENDING_BOARD":
      return "Dang for Board review";
    case "TIE_BREAK":
      return "Can tie-break";
    default:
      return "Trang thai khac";
  }
}
