import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import {
  BOARD_QUORUM,
  BOARD_TOTAL,
  EIC_TIEBREAK_WEIGHT,
} from "@/entities/proposal/model/proposal-types";
import { evaluateBoardTally } from "@/entities/proposal/model/board-tally";
import { useMemo } from "react";

const DECISIVE = new Set(["DECIDE", "REJECT", "TIE_BREAK", "FORCE_STATUS", "FORWARD", "RECALL"]);

export function DecisionHistory({ proposal }: { proposal: SeriesProposal }) {
  const events = useMemo(
    () =>
      proposal.history
        .filter((e) => DECISIVE.has(e.type))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [proposal.history],
  );
  const tally = evaluateBoardTally(proposal.votes);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card/40 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Luật quyết định
        </p>
        <ul className="space-y-1 text-xs text-foreground/85">
          <li>
            Quorum: {BOARD_QUORUM}/{BOARD_TOTAL} phiếu cùng loại {"->"} APPROVED hoặc REJECTED ngay
            lập tức.
          </li>
          <li>
            Đủ {BOARD_TOTAL} phiếu, không bên nào đạt {BOARD_QUORUM}: bên đa số thắng.
          </li>
          <li>
            Hòa tuyệt đối {"->"} status TIE_BREAK. Editor-in-chief có phiếu quyết định với weight{" "}
            {EIC_TIEBREAK_WEIGHT}.
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Phiếu cuối cùng
        </p>
        {proposal.votes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có phiếu nào.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {proposal.votes.map((v) => (
              <li
                key={v.memberId}
                className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5"
              >
                <span className="font-medium">
                  {v.memberName}
                  {v.isEditorInChief ? (
                    <span className="ml-2 rounded bg-fuchsia-100 px-1.5 text-[10px] font-bold text-fuchsia-900">
                      Editor-in-chief
                    </span>
                  ) : v.isChair ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-900">
                      Chair
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {v.decision}
                  {v.weight && v.weight > 1 ? ` - w${v.weight}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">{tally.reason}</p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Mốc quyết định
        </p>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có quyết định nào.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-5">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[27px] top-1.5 size-2.5 rounded-full border-2 border-background bg-foreground" />
                <p className="text-xs font-semibold">
                  {e.type} - {e.actorName}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {e.fromStatus ?? "-"} to {e.toStatus ?? "-"}
                </p>
                {e.comment ? (
                  <p className="mt-1 rounded border-l-2 border-accent bg-muted/40 px-3 py-1.5 text-xs text-foreground/80">
                    {e.comment}
                  </p>
                ) : null}
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString("vi-VN")}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
