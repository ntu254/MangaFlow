import { Loader2 } from "lucide-react";
import { useProposalVersionsQuery } from "@/features/proposals";
import type { ProposalVersion } from "@/entities/proposal/model/proposal-types";
import { ResolvedFileLink } from "@/shared/ui/resolved-file-link";

type VersionSnapshot = {
  title?: string;
  frozenFromStatus?: string;
  manuscripts?: Array<{
    fileName?: string;
    fileUrl?: string;
    fileKey?: string;
    version?: number;
  }>;
  materials?: Array<{ title?: string; fileName?: string; fileUrl?: string; fileKey?: string }>;
};

const SOURCE_LABEL: Record<ProposalVersion["source"], string> = {
  PROPOSAL: "Submitted by Mangaka",
  VOTING_SESSION: "Frozen for Board review",
  MIGRATION: "Migrated record",
};

export function ProposalVersionHistory({ proposalId }: { proposalId: string }) {
  const { data: versions, isLoading } = useProposalVersionsQuery(proposalId);

  if (isLoading) {
    return (
      <div className="flex min-h-32 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sorted = [...(versions ?? [])].sort(
    (a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0),
  );

  if (sorted.length === 0) {
    return (
      <p className="rounded border border-dashed border-border bg-card/40 p-4 text-xs text-muted-foreground">
        No submission versions yet. Each time the proposal is submitted or resubmitted, an immutable
        version snapshot is recorded here.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {sorted.map((version) => {
        const snapshot = version.snapshot as VersionSnapshot | undefined;
        return (
          <li key={version.id} className="rounded-lg border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold">
                Version {version.versionNumber ?? version.proposalVersionId}
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {SOURCE_LABEL[version.source]}
                </span>
                {snapshot?.frozenFromStatus ? (
                  <span className="ml-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {snapshot.frozenFromStatus}
                  </span>
                ) : null}
              </p>
              <span className="text-[10px] font-mono text-muted-foreground">
                {new Date(version.frozenAt ?? version.createdAt).toLocaleString()}
              </span>
            </div>

            {snapshot?.title ? (
              <p className="mt-1 text-xs text-foreground/80">{snapshot.title}</p>
            ) : null}

            <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Manuscripts ({snapshot?.manuscripts?.length ?? 0})
                </p>
                <ul className="mt-1 space-y-1">
                  {(snapshot?.manuscripts ?? []).map((item) => (
                    <li key={item.fileName ?? item.fileUrl ?? "ms"}>
                      <ResolvedFileLink
                        fileKey={item.fileKey}
                        fallbackUrl={item.fileUrl}
                        fileName={item.fileName}
                        className="text-primary hover:underline"
                      >
                        v{item.version ?? 1} · {item.fileName ?? "Manuscript"}
                      </ResolvedFileLink>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Supporting materials ({snapshot?.materials?.length ?? 0})
                </p>
                <ul className="mt-1 space-y-1">
                  {(snapshot?.materials ?? []).map((item, index) => (
                    <li key={item.fileName ?? item.title ?? `mat-${index}`}>
                      <ResolvedFileLink
                        fileKey={item.fileKey}
                        fallbackUrl={item.fileUrl}
                        fileName={item.fileName ?? item.title}
                        className="text-primary hover:underline"
                      >
                        {item.title ?? item.fileName ?? "Material"}
                      </ResolvedFileLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
