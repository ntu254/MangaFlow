import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { useProposalQuery, useUpdateProposalMutation } from "@/features/proposals";
import { ProposalStatusPill } from "@/entities/proposal";
import { StatusFlow } from "@/entities/proposal";
import { VoteTally } from "@/entities/proposal";
import { ActionPanel } from "./action-panel";
import { ProposalWizard } from "../../create/components/proposal-wizard";
import { EmptyState } from "@/shared/ui/empty-state";
import { AUDIENCE_LABEL } from "@/entities/proposal/model/proposal-types";
import { ManuscriptList } from "./manuscript-list";
import { MaterialsViewer } from "@/entities/proposal";
import { RevisionChecklist } from "./revision-checklist";
import { DecisionHistory } from "@/entities/proposal";
import { Timeline } from "./timeline";
import { ResolvedImage } from "@/shared/ui";

type Tab = "overview" | "manuscripts" | "materials" | "revision" | "decision";

const TABS: { id: Tab; label: string; badge?: number }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "manuscripts", label: "Bản thảo" },
  { id: "materials", label: "Tư liệu" },
  { id: "revision", label: "Revision" },
  { id: "decision", label: "Lịch sử quyết định" },
];

export function ProposalDetailPage({
  proposalId,
  editing = false,
}: {
  proposalId: string;
  editing?: boolean;
}) {
  const user = useAuth((s) => s.user);
  const { data: proposal, isLoading } = useProposalQuery(proposalId);
  const updateProposalMutation = useUpdateProposalMutation(proposalId);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <EmptyState
        title="Proposal không tồn tại"
        description="Có thể proposal đã bị xoá hoặc id sai."
        action={
          <Link to="/app/submissions" className="text-xs underline">
            Quay lại danh sách
          </Link>
        }
      />
    );
  }

  const canEdit =
    (user.role === "admin" || (user.role === "mangaka" && proposal.authorId === user.id)) &&
    ["DRAFT", "CHANGES_REQUESTED"].includes(proposal.status);

  if (editing && canEdit) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          onClick={() => {
            navigate({ to: "/app/submissions/$id", params: { id: proposalId }, search: {} });
          }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Huỷ chỉnh sửa
        </button>
        <header className="border-b border-border pb-4">
          <h1 className="font-serif text-3xl">Chỉnh sửa proposal</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Trạng thái hiện tại: <ProposalStatusPill status={proposal.status} />
          </p>
        </header>
        <ProposalWizard
          mode="edit"
          initialProposal={proposal}
          submitLabel="Save changes"
          onCancel={() =>
            navigate({ to: "/app/submissions/$id", params: { id: proposalId }, search: {} })
          }
          onSave={async (payload) => {
            try {
              await updateProposalMutation.mutateAsync(payload);
              toast.success("Đã lưu thay đổi.");
              navigate({ to: "/app/submissions/$id", params: { id: proposalId }, search: {} });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Lỗi khi lưu thay đổi.");
              throw error;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/app/submissions"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Submissions
      </Link>

      {editing && !canEdit ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Proposal này không thể chỉnh sửa với tài khoản hoặc trạng thái hiện tại.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <ResolvedImage
              fileKey={proposal.coverFileKey}
              fallbackUrl={proposal.coverUrl}
              alt={proposal.title}
              className="aspect-[2/3] w-full object-cover"
            />
          </div>
          <div className="space-y-2 text-xs">
            <Meta label="Tác giả" value={proposal.authorName} />
            <Meta label="Audience" value={AUDIENCE_LABEL[proposal.targetAudience]} />
            <Meta label="Chapters" value={String(proposal.chaptersPlanned)} />
            <Meta label="Genres" value={proposal.genres.join(", ")} />
            <Meta label="Editor" value={proposal.assignedEditorName ?? "Chưa assign"} />
            <Meta label="Vòng revision" value={String(proposal.revisionRound ?? 0)} />
            <Meta
              label="Sample"
              value={
                <a
                  href={proposal.sampleChapterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Mở chapter mẫu
                </a>
              }
            />
          </div>
        </aside>

        <div className="space-y-6">
          <header>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Proposal · {proposal.id}
                </p>
                <h1 className="mt-1 font-serif text-4xl">{proposal.title}</h1>
              </div>
              <ProposalStatusPill status={proposal.status} size="lg" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{proposal.synopsis}</p>
          </header>

          <StatusFlow status={proposal.status} />

          <ActionPanel proposal={proposal} user={user} />

          <div className="flex flex-wrap gap-1 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold ${tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
                {typeof t.badge === "number" && t.badge > 0 ? (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] text-foreground/70">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <div className="space-y-6">
              {proposal.status === "PENDING_BOARD" ||
              proposal.status === "TIE_BREAK" ||
              proposal.status === "APPROVED" ||
              proposal.status === "REJECTED" ? (
                <VoteTally votes={proposal.votes} status={proposal.status} />
              ) : null}
              <section>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Timeline
                </h2>
                <Timeline events={proposal.history} />
              </section>
            </div>
          ) : tab === "manuscripts" ? (
            <ManuscriptList manuscripts={proposal.manuscripts} />
          ) : tab === "materials" ? (
            <MaterialsViewer proposal={proposal} user={user} />
          ) : tab === "revision" ? (
            <RevisionChecklist proposal={proposal} />
          ) : (
            <DecisionHistory proposal={proposal} />
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-xs text-foreground">{value}</span>
    </div>
  );
}
