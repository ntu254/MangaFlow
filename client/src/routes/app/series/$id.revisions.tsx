import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import {
  findSeries,
  proposalBySeries,
  manuscriptBySeries,
  versionsByManuscript,
  reviewsBySeries,
  votesBySeries,
  findStaff,
  currentUserByRole,
} from "@/entities";
import { AuditTimeline } from "@/shared/ui/site/AuditTimeline";
import { useState } from "react";
import { useRole } from "@/shared/lib/role";
import { canSubmitProposal } from "@/shared/lib/permissions";
import { logAudit } from "@/shared/lib/audit";
import { notify } from "@/shared/lib/notifications";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/app/series/$id/revisions")({
  loader: ({ params }) => {
    const s = findSeries(params.id);
    if (!s) throw notFound();
    return { series: s };
  },
  component: RevisionsPage,
});

function RevisionsPage() {
  const { series } = Route.useLoaderData();
  const { role } = useRole();
  const me = currentUserByRole[role];
  const perm = canSubmitProposal(role, series);

  const proposal = proposalBySeries(series.id);
  const manuscript = manuscriptBySeries(series.id);
  const [versions, setVersions] = useState(() =>
    manuscript ? versionsByManuscript(manuscript.id) : [],
  );
  const reviews = reviewsBySeries(series.id);
  const votes = votesBySeries(series.id);
  const [note, setNote] = useState("");

  function uploadVersion() {
    if (!manuscript) return toast.error("No manuscript exists.");
    const next = {
      id: `mv_${Date.now()}`,
      manuscriptId: manuscript.id,
      version: (versions.at(-1)?.version ?? 0) + 1,
      fileName: `${series.slug}-v${(versions.at(-1)?.version ?? 0) + 1}.pdf`,
      pageCount: 30,
      uploadedBy: me.id,
      uploadedAt: new Date().toLocaleString(),
      note,
    };
    setVersions([...versions, next]);
    logAudit({
      type: "MANUSCRIPT_VERSION_UPLOADED",
      actorId: me.id,
      entity: "manuscript",
      entityId: manuscript.id,
    });
    logAudit({
      type: "SERIES_SUBMITTED_TO_EDITOR",
      actorId: me.id,
      entity: "series",
      entityId: series.id,
    });
    notify(series.editorId, {
      type: "SERIES_SUBMITTED_TO_EDITOR",
      title: `${series.title} resubmitted`,
      body: `Mangaka uploaded v${next.version}.`,
      link: `/app/editor/series/${series.id}/review`,
    });
    toast.success("New manuscript version uploaded & submitted.");
    setNote("");
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PageHeader
          title={`${series.title} · Revisions`}
          jp="改訂履歴"
          description={
            <Link to="/app/series/$id" params={{ id: series.id }} className="underline-offset-2 hover:underline">
              ← Back to series
            </Link>
          }
        />

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-foreground/55 mb-2">
            Proposal status
          </div>
          <div className="text-sm font-semibold capitalize">{series.status.replace("-", " ")}</div>
          <div className="mt-1 text-xs text-foreground/65">
            {proposal?.synopsis ?? series.synopsis}
          </div>
        </div>

        <div className="rounded-md border border-foreground/10 bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-foreground/55">
              Manuscript versions
            </div>
          </div>
          <div className="divide-y divide-foreground/10">
            {versions.map((v) => {
              const uploader = findStaff(v.uploadedBy);
              return (
                <div key={v.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="font-mono text-xs text-foreground/55">v{v.version}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{v.fileName}</div>
                    <div className="text-[11px] text-foreground/55">
                      {uploader?.name} · {v.uploadedAt} · {v.pageCount}p
                    </div>
                    {v.note && <div className="text-xs text-foreground/70">{v.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {!perm.allowed ? (
            <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              {perm.reason}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-foreground/20 bg-foreground/5 p-3">
              <div className="mb-2 text-xs font-semibold">Upload new version</div>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note for editor…"
                className="w-full rounded border border-foreground/15 bg-background p-2 text-xs"
              />
              <button
                onClick={uploadVersion}
                className="mt-2 h-8 rounded-md bg-foreground px-3 text-xs font-bold text-background"
              >
                <Upload className="mr-1 inline h-3 w-3" /> Upload v{(versions.at(-1)?.version ?? 0) + 1}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-md border border-foreground/10 bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-foreground/55 mb-2">
            Editor feedback
          </div>
          {reviews.length === 0 && (
            <div className="text-xs text-foreground/55">No editor feedback yet.</div>
          )}
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded border border-foreground/10 p-2 text-xs">
                <div className="font-bold uppercase tracking-wide">{r.decision}</div>
                <div className="mt-0.5">{r.comment}</div>
                <div className="mt-0.5 text-foreground/55">{r.at}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-foreground/10 bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-foreground/55 mb-2">
            Board votes
          </div>
          {votes.length === 0 && <div className="text-xs text-foreground/55">No votes yet.</div>}
          <div className="space-y-2">
            {votes.map((v) => (
              <div key={v.id} className="rounded border border-foreground/10 p-2 text-xs">
                <div className="font-bold uppercase">{v.vote}</div>
                <div className="text-foreground/65">{v.comment}</div>
                <div className="text-foreground/55">{v.at}</div>
              </div>
            ))}
          </div>
        </div>
        <AuditTimeline entity="series" entityId={series.id} limit={8} />
      </div>
    </div>
  );
}
