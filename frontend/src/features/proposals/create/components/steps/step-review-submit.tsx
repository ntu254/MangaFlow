import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  BookOpen,
  Users,
  Sparkles,
  MessageSquare,
  FileArchive,
  Image as ImageIcon,
} from "lucide-react";
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
      {/* Editorial Proposal Dossier Header Card */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {coverUrl ? (
            <div className="w-28 shrink-0 overflow-hidden rounded-xl border border-border/80 shadow-md">
              <ResolvedImage
                fallbackUrl={coverUrl}
                alt="Series cover"
                className="aspect-[2/3] w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[2/3] w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border/80 bg-muted/30 p-2 text-center text-muted-foreground">
              <ImageIcon className="size-6 text-muted-foreground/60" />
              <span className="text-[10px] font-semibold">No cover image</span>
            </div>
          )}

          <div className="flex-1 space-y-2.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                Executive Dossier
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">Step 3 of 3</span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-foreground leading-tight truncate">
              {values.title || "Untitled Series"}
            </h3>

            {values.logline ? (
              <p className="text-xs italic text-muted-foreground line-clamp-2">
                "{values.logline}"
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {values.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-md border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-2xs"
                >
                  {g}
                </span>
              ))}
              {values.targetAudience ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {(AUDIENCE_LABEL as Record<string, string>)[values.targetAudience] ?? values.targetAudience}
                </span>
              ) : null}
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary tabular-nums">
                {values.chaptersPlanned ?? 24} chapters planned
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Story Pitch & Details Card */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="size-4" />
          </div>
          <h4 className="text-xs font-bold text-foreground">Pitch & Narrative Details</h4>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Synopsis</span>
            <p className="whitespace-pre-wrap leading-relaxed text-foreground rounded-xl border border-border/60 bg-background/50 p-3.5">
              {values.synopsis || "No synopsis provided."}
            </p>
          </div>

          {values.hook ? (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Core Hook & Selling Point</span>
              <p className="whitespace-pre-wrap leading-relaxed text-foreground rounded-xl border border-border/60 bg-background/50 p-3.5">
                {values.hook}
              </p>
            </div>
          ) : null}

          {mainCharacters ? (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Main Characters</span>
              <p className="whitespace-pre-wrap leading-relaxed text-foreground rounded-xl border border-border/60 bg-background/50 p-3.5">
                {mainCharacters}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Uploaded Materials Status Card */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-4" />
            </div>
            <h4 className="text-xs font-bold text-foreground">Attached Files & Verification</h4>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">
            {[manuscript ? 1 : 0, storyboard.length > 0 ? 1 : 0, characterSheets.length > 0 ? 1 : 0].reduce((a, b) => a + b, 0)} files attached
          </span>
        </div>

        <div className="space-y-2">
          <FileCard
            label="Sample Manuscript"
            file={manuscript ? { name: manuscript.fileName, sizeKB: manuscript.sizeKB, type: manuscript.fileType } : null}
            required
          />
          <FileCard
            label="Storyboard / Name"
            file={storyboard[0] ? { name: storyboard[0].fileName, sizeKB: storyboard[0].sizeKB, type: storyboard[0].fileType } : null}
            required
          />
          {characterSheets.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-background/50 p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Supporting Materials ({characterSheets.length})</span>
              <div className="space-y-1.5">
                {characterSheets.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-medium text-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">{c.kind}</span>
                      <span className="truncate">{c.title || c.fileName}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{(c.sizeKB / 1024).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note to Editor */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Note to Managing Editor</h4>
            <p className="text-[10px] text-muted-foreground">Optional notes, version history, or context for the editorial team</p>
          </div>
        </div>

        <Textarea
          rows={3}
          value={submissionNote}
          onChange={(e) => onSubmissionNoteChange(e.target.value)}
          placeholder="e.g. This is an updated Chapter 1 draft featuring revised dialogue based on editor feedback..."
          className="rounded-xl text-xs bg-background/50 border-border/80 focus:bg-background"
        />
      </div>

      {/* High-Trust Legal & Rights Attestation Card */}
      <label className={`group flex items-start gap-3.5 rounded-2xl border p-5 cursor-pointer transition-all duration-200 shadow-2xs ${
        originalWorkConfirmed
          ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
          : "border-border/80 bg-card/60 hover:border-primary/40 hover:bg-card"
      }`}>
        <Checkbox
          checked={originalWorkConfirmed}
          onCheckedChange={(v) => onOriginalWorkConfirmedChange(v === true)}
          className="mt-0.5 rounded-md size-4 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`size-4 transition-colors ${originalWorkConfirmed ? "text-emerald-500" : "text-muted-foreground"}`} />
            <span className="text-xs font-bold text-foreground">Original Work & Copyright Attestation</span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            I certify that I am the author/creator of this proposal and hold all necessary publishing rights to submit the manuscript, storyboards, and materials to MangaFlow Studio.
          </p>
        </div>
      </label>

      {/* Submission Status Alert Banner */}
      {ready ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-2xs">
          <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/20 shrink-0">
            <CheckCircle2 className="size-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-bold text-foreground">Ready for Editorial Review!</p>
            <p className="text-[11px] text-muted-foreground font-normal">
              Click <strong className="text-foreground">"Submit to editor"</strong> on the right panel to send your proposal to the board.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-700 dark:text-amber-300 shadow-2xs">
          <div className="grid size-8 place-items-center rounded-xl bg-amber-500/20 shrink-0">
            <AlertTriangle className="size-5 text-amber-500" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <p className="font-bold text-foreground">Action items required before submission:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
              {missingManuscript ? <li>Upload Sample Manuscript (Step 2)</li> : null}
              {missingStoryboard ? <li>Upload Storyboard / Name Pages (Step 2)</li> : null}
              {!originalWorkConfirmed ? <li>Confirm Original Work & Copyright Attestation above</li> : null}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function FileCard({
  label,
  file,
  required,
}: {
  label: string;
  file: { name: string; sizeKB: number; type?: string } | null;
  required?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-3 text-xs">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`grid size-8 place-items-center rounded-lg border text-xs font-bold ${
          file ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
        }`}>
          {file ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            {required && !file ? (
              <span className="rounded bg-rose-500/10 px-1.5 py-0.2 text-[9px] font-bold text-rose-500">Required</span>
            ) : null}
          </div>
          {file ? (
            <p className="truncate text-xs font-bold text-foreground">{file.name}</p>
          ) : (
            <p className="text-xs italic text-rose-500">No file uploaded</p>
          )}
        </div>
      </div>
      {file ? (
        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0">
          {(file.sizeKB / 1024).toFixed(2)} MB
        </span>
      ) : null}
    </div>
  );
}
