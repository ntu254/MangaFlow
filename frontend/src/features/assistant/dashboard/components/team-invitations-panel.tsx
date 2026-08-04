import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  Users,
  XCircle,
  Sparkles,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import {
  useMyInvitesQuery,
  useAcceptInviteMutation,
  useDeclineInviteMutation,
  type SeriesInvite,
} from "../../api/assistant-queries";
import { timeAgo } from "@/shared/lib/format-date";

export function TeamInvitationsPanel() {
  const { data: invites = [], isLoading } = useMyInvitesQuery();
  const acceptMutation = useAcceptInviteMutation();
  const declineMutation = useDeclineInviteMutation();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pending = invites.filter((inv) => inv.status === "PENDING");

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xs backdrop-blur-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Mail className="size-4" />
          </div>
          <div className="h-4 w-32 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="h-20 rounded-xl bg-muted/30 animate-pulse" />
      </div>
    );
  }

  if (pending.length === 0) return null;

  const handleAccept = async (invite: SeriesInvite) => {
    setProcessingId(invite.id);
    try {
      await acceptMutation.mutateAsync(invite.id);
      toast.success(`You joined ${invite.seriesTitle || "the team"}!`, {
        description: "You can now access the series studio and receive task assignments.",
      });
    } catch (err: any) {
      const message =
        err?.message || err?.data?.message || "Failed to accept invite.";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invite: SeriesInvite) => {
    setProcessingId(invite.id);
    try {
      await declineMutation.mutateAsync(invite.id);
      toast.info("Invitation declined.");
    } catch (err: any) {
      const message =
        err?.message || err?.data?.message || "Failed to decline invite.";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-5 shadow-2xs backdrop-blur-xs space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Mail className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Team Invitations
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {pending.length} pending invitation{pending.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary tabular-nums animate-pulse">
          {pending.length} New
        </span>
      </div>

      {/* Invite Cards */}
      <div className="space-y-3">
        {pending.map((invite) => {
          const isProcessing = processingId === invite.id;
          const scopeLabel =
            invite.scope === "Task only"
              ? "Task Only"
              : invite.scope === "Read only"
                ? "Read Only"
                : "Full Chapter";

          return (
            <div
              key={invite.id}
              className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3 transition-all hover:border-primary/40"
            >
              {/* Series Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                    <BookOpen className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif font-bold text-sm text-foreground truncate">
                      {invite.seriesTitle || `Series ${invite.seriesId}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Invited by{" "}
                      <strong className="text-foreground font-semibold">
                        {invite.inviterName || invite.invitedById}
                      </strong>{" "}
                      · {timeAgo(invite.createdAt)}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 shrink-0">
                  <Clock className="inline size-3 mr-0.5 -mt-0.5" />
                  Pending
                </span>
              </div>

              {/* Metadata Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 border border-border/60 px-2.5 py-1 text-[10px] font-bold text-foreground">
                  <Users className="size-3 text-muted-foreground" />
                  Role: Assistant
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 border border-border/60 px-2.5 py-1 text-[10px] font-bold text-foreground">
                  <ShieldCheck className="size-3 text-muted-foreground" />
                  Scope: {scopeLabel}
                </span>
                {invite.expiresAt && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[10px] font-bold text-rose-500">
                    <Clock className="size-3" />
                    Expires {timeAgo(invite.expiresAt)}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-border/60">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecline(invite)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <XCircle className="size-3.5" />
                  Decline
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAccept(invite)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-all hover:opacity-90 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Sparkles className="size-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Accept & Join Team
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
