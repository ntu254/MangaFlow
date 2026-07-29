import type { RankingImportJob } from "@/entities/board/model/board-types";

export function RankingImportPreview({ jobs }: { jobs: RankingImportJob[] }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Import Preview
      </p>
      {jobs.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No import jobs yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between rounded border border-border bg-background px-3 py-2 text-xs"
            >
              <span>
                <span className="font-semibold">{job.fileName}</span>
                <span className="ml-2 text-muted-foreground">{job.rowCount} rows</span>
              </span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                {job.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
