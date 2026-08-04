import { Upload, Users, BookOpen, LayoutGrid, Image as ImageIcon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ManuscriptUploader,
  MaterialsUploader,
  type DraftManuscript,
  type DraftMaterial,
} from "../manuscript-uploader";

type Props = {
  mainCharacters: string;
  onMainCharactersChange: (v: string) => void;
  manuscript: DraftManuscript | null;
  onManuscriptChange: (v: DraftManuscript | null) => void;
  characterSheets: DraftMaterial[];
  onCharacterSheetsChange: (v: DraftMaterial[]) => void;
  storyboard: DraftMaterial[];
  onStoryboardChange: (v: DraftMaterial[]) => void;
  filesRequired?: boolean;
  error?: string;
};

export function StepCharactersMaterials({
  mainCharacters,
  onMainCharactersChange,
  manuscript,
  onManuscriptChange,
  characterSheets,
  onCharacterSheetsChange,
  storyboard,
  onStoryboardChange,
  filesRequired = true,
  error,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Character Profiles Section */}
      <div className="rounded-2xl border border-border/80 bg-card/40 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">Main Characters Description</h3>
              <p className="text-[10px] text-muted-foreground">List 2–4 key characters with brief roles or background</p>
            </div>
          </div>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
            {mainCharacters.length}/1000
          </span>
        </div>

        <Textarea
          rows={4}
          value={mainCharacters}
          onChange={(e) => onMainCharactersChange(e.target.value)}
          placeholder={`e.g.\n- Renji (17, Swordsman): Searching for his lost clan relic, reckless but loyal.\n- Mira (16, Alchemist): Secretly holds the key to the city's power source.`}
          maxLength={1100}
          className="rounded-xl text-xs bg-background/50 border-border/80 focus:bg-background"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-500">
          {error}
        </div>
      ) : null}

      {/* Upload Cards Grid */}
      <div className="space-y-5">
        <UploadSection
          icon={<BookOpen className="size-4 text-primary" />}
          title="Sample Manuscript"
          required={filesRequired}
          description="Upload your sample manuscript (Chapter 1 or Pilot script). Accepted: .pdf, .zip, .png, .jpg — max 25 MB."
        >
          <ManuscriptUploader
            value={manuscript}
            onChange={onManuscriptChange}
            label={filesRequired ? "Sample manuscript (required)" : "Current manuscript"}
            required={filesRequired}
          />
        </UploadSection>

        <UploadSection
          icon={<LayoutGrid className="size-4 text-primary" />}
          title="Storyboard / Name Pages"
          required={filesRequired}
          description="Your rough storyboard or panel layout pages (1 file max). Accepted: .pdf, .zip, .png, .jpg — max 25 MB."
        >
          <MaterialsUploader
            items={storyboard}
            onChange={onStoryboardChange}
            allowedKinds={["storyboard"]}
            maxFiles={1}
            required={filesRequired}
            label="Storyboard file"
          />
        </UploadSection>

        <UploadSection
          icon={<ImageIcon className="size-4 text-primary" />}
          title="Character Sheets & References"
          description="Optional supporting visual assets: character sheets, world bibles, reference artwork, or notes."
        >
          <MaterialsUploader
            items={characterSheets}
            onChange={onCharacterSheetsChange}
            allowedKinds={["character", "world", "reference", "other"]}
            label="Supporting materials"
          />
        </UploadSection>
      </div>
    </div>
  );
}

function UploadSection({
  icon,
  title,
  required,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xs backdrop-blur-xs space-y-3.5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10">
            {icon}
          </div>
          <span className="text-xs font-bold text-foreground">{title}</span>
        </div>
        {required ? (
          <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-500">
            Required
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Optional
          </span>
        )}
      </div>
      {description ? <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p> : null}
      {children}
    </div>
  );
}
