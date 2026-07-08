import { useMemo, useState } from "react";
import { useAuth } from "@/shared/auth";
import { seriesForEditor } from "../../model/editor-access";
import { useMySeriesQuery } from "@/entities/series";
import {
  RECOMMENDATION_LABEL,
  useBoardBriefs,
  type BriefRecommendation,
} from "../model/board-briefs-store";
import { formatDateTime } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui";

export function BoardBriefsPage() {
  const user = useAuth((s) => s.user);
  const { data: series = [] } = useMySeriesQuery();
  const mySeries = useMemo(() => (user ? seriesForEditor(series, user.id) : []), [series, user]);
  const briefs = useBoardBriefs((s) => s.briefs);
  const upsert = useBoardBriefs((s) => s.upsert);

  const [seriesId, setSeriesId] = useState(mySeries[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [riskFactors, setRiskFactors] = useState("");
  const [consistency, setConsistency] = useState("");
  const [ranking, setRanking] = useState("");
  const [recommendation, setRecommendation] = useState<BriefRecommendation>("CONTINUE");

  if (!user) return null;

  const onSave = () => {
    if (!seriesId) return;
    upsert({
      seriesId,
      notes,
      riskFactors,
      productionConsistency: consistency,
      rankingSummary: ranking,
      recommendation,
      authorId: user.id,
      authorName: user.name,
    });
    setNotes("");
    setRiskFactors("");
    setConsistency("");
    setRanking("");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        eyebrow="Editor"
        title="Board Briefs"
        description="Chuẩn bị recommendation editorial trước khi đưa lên Board. Editor không vote thay Board."
      />

      {mySeries.length === 0 ? (
        <EmptyState title="Bạn chưa được phân công series nào" />
      ) : (
        <section className="space-y-3 rounded-md border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            New brief
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Series
              </span>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {mySeries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recommendation
              </span>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as BriefRecommendation)}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {Object.entries(RECOMMENDATION_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Field label="Ranking / reader metric" value={ranking} onChange={setRanking} />
          <Field label="Production consistency" value={consistency} onChange={setConsistency} />
          <Field label="Risk factors" value={riskFactors} onChange={setRiskFactors} />
          <Field label="Editor notes" value={notes} onChange={setNotes} multiline />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
            >
              Save brief
            </button>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Past briefs
        </p>
        {briefs.length === 0 ? (
          <EmptyState title="Chưa có hồ sơ Board nào" />
        ) : (
          <ul className="space-y-2">
            {briefs.map((b) => {
              const s = series.find((x) => x.id === b.seriesId);
              return (
                <li key={b.id} className="rounded-md border border-border bg-card p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{s?.title ?? b.seriesId}</p>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {RECOMMENDATION_LABEL[b.recommendation]}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{b.notes}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {b.authorName} · {formatDateTime(b.updatedAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="space-y-1 text-xs">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded border border-border bg-background p-2 text-xs"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
        />
      )}
    </label>
  );
}
