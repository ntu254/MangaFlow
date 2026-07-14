import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AUDIENCE_LABEL } from "@/entities/proposal/model/proposal-types";
import type { WizardValues } from "../proposal-wizard";
import type { DraftManuscript, DraftMaterial } from "../manuscript-uploader";
import { ResolvedImage } from "@/shared/ui";

type Props = {
  values: WizardValues;
  mainCharacters: string;
  manuscript: DraftManuscript | null;
  storyboard: DraftMaterial[];
  characterSheets: DraftMaterial[];
  submissionNote: string;
  onSubmissionNoteChange: (v: string) => void;
  originalWorkConfirmed: boolean;
  onOriginalWorkConfirmedChange: (v: boolean) => void;
  coverUrl: string;
};

export function StepReviewSubmit({
  values,
  mainCharacters,
  manuscript,
  storyboard,
  characterSheets,
  submissionNote,
  onSubmissionNoteChange,
  originalWorkConfirmed,
  onOriginalWorkConfirmedChange,
  coverUrl,
}: Props) {
  const missingStoryboard = storyboard.length === 0;
  const missingManuscript = !manuscript;
  const ready = !missingStoryboard && !missingManuscript && originalWorkConfirmed;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
        <ResolvedImage
          fallbackUrl={coverUrl}
          alt="cover"
          className="aspect-[2/3] w-full rounded border border-border object-cover"
        />
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Proposal preview
          </p>
          <h3 className="font-serif text-2xl">{values.title || "Untitled"}</h3>
          <div className="flex flex-wrap gap-1">
            {values.genres.map((g) => (
              <span
                key={g}
                className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold"
              >
                {g}
              </span>
            ))}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
              {(AUDIENCE_LABEL as Record<string, string>)[values.targetAudience] ?? "Not selected"}
            </span>
          </div>
          {values.logline ? (
            <p className="text-sm italic text-muted-foreground">"{values.logline}"</p>
          ) : null}
        </div>
      </div>

      <Section title="Synopsis">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {values.synopsis || "\u2014"}
        </p>
      </Section>

      {values.hook ? (
        <Section title="Hook / selling point">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{values.hook}</p>
        </Section>
      ) : null}

      {mainCharacters ? (
        <Section title="Characters">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{mainCharacters}</p>
        </Section>
      ) : null}

      <Section title="Uploaded materials">
        <ul className="space-y-2 text-xs">
          <FileRow
            label="Manuscript"
            items={
              manuscript
                ? [
                    {
                      name: manuscript.fileName,
                      size: manuscript.sizeKB,
                      type: manuscript.fileType,
                      pages: manuscript.pageCount,
                    },
                  ]
                : []
            }
            missing={missingManuscript}
            required
          />
          <FileRow
            label="Storyboard / Name"
            items={storyboard.map((m) => ({
              name: m.fileName,
              size: m.sizeKB,
              type: m.fileType,
            }))}
            missing={missingStoryboard}
            required
          />
          {characterSheets.length > 0 ? (
            <FileRow
              label="Character sheets & references"
              items={characterSheets.map((m) => ({
                name: m.fileName,
                size: m.sizeKB,
                type: m.fileType,
              }))}
            />
          ) : null}
        </ul>
      </Section>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Note to editor
          <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Textarea
          rows={3}
          value={submissionNote}
          onChange={(e) => onSubmissionNoteChange(e.target.value)}
          placeholder="e.g. This is a revised sample based on feedback from the June 12 pitch session…"
        />
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-muted/30 transition-colors">
        <Checkbox
          checked={originalWorkConfirmed}
          onCheckedChange={(v) => onOriginalWorkConfirmedChange(v === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <span className="text-sm font-medium">Original work confirmation</span>
          <p className="text-xs text-muted-foreground">
            I confirm that this is an <strong>original work</strong> and I hold all rights to submit
            the manuscript and supporting materials to MangaFlow for editorial review.
          </p>
        </div>
      </label>

      {ready ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
          <CheckCircle2 className="size-4 shrink-0" />
          Ready to submit. Click &ldquo;Submit to editor&rdquo; when you&apos;re done.
        </div>
      ) : (
        <div className="space-y-1.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-3.5 shrink-0" /> Cannot submit yet:
          </p>
          <ul className="ml-5 list-disc space-y-0.5">
            {missingManuscript ? <li>Manuscript upload is required (Step 2).</li> : null}
            {missingStoryboard ? <li>Storyboard upload is required (Step 2).</li> : null}
            {!originalWorkConfirmed ? <li>Original work confirmation is required.</li> : null}
          </ul>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 rounded-md border border-border bg-card/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

type FileInfo = { name: string; size: number; type: string; pages?: number };

function FileRow({
  label,
  items,
  missing,
  required,
}: {
  label: string;
  items: FileInfo[];
  missing?: boolean;
  required?: boolean;
}) {
  return (
    <li>
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {required ? (
          <Badge variant="outline" className="text-[8px] px-1 py-0">
            Required
          </Badge>
        ) : null}
      </div>
      {missing ? (
        <p className="mt-0.5 text-[11px] text-rose-600">No file uploaded.</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {items.map((m, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <FileText className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{m.name}</span>
              <span className="text-muted-foreground shrink-0">
                {m.size} KB
                {m.pages ? ` \u00b7 ${m.pages} pages` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
