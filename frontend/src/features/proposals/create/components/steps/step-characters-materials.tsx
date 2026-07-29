import { Upload } from "lucide-react";
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
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Characters description
          </Label>
          <span className="text-[10px] text-muted-foreground">{mainCharacters.length}/1000</span>
        </div>
        <Textarea
          rows={5}
          value={mainCharacters}
          onChange={(e) => onMainCharactersChange(e.target.value)}
          placeholder={`List 2–4 main characters.\ne.g.\n- Renji (17, swordsman): searching for his father…\n- Mira (16, blacksmith): secretly a descendant of…`}
          maxLength={1100}
        />
        <p className="text-[10px] text-muted-foreground">
          Brief character profiles help editors understand your story.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-5">
        <UploadSection
          title="Manuscript"
          required={filesRequired}
          description="Upload your sample manuscript (first chapter or pilot). Accepted: .pdf, .zip, .png, .jpg — max 25 MB."
        >
          <ManuscriptUploader
            value={manuscript}
            onChange={onManuscriptChange}
            label={filesRequired ? "Sample manuscript v1" : "Current / replacement manuscript"}
            required={filesRequired}
          />
        </UploadSection>

        <UploadSection
          title="Storyboard / Name"
          required={filesRequired}
          description="Your rough storyboard or name pages. Accepted: .pdf, .zip, .png, .jpg — max 25 MB."
        >
          <MaterialsUploader
            items={storyboard}
            onChange={onStoryboardChange}
            allowedKinds={["world"]}
            maxFiles={1}
            required={filesRequired}
            label="Storyboard file (1 file max)"
          />
        </UploadSection>

        <UploadSection
          title="Character sheets & references"
          description="Optional supporting materials — character sheets, world bibles, reference images."
        >
          <MaterialsUploader
            items={characterSheets}
            onChange={onCharacterSheetsChange}
            allowedKinds={["character", "reference", "other"]}
            label="Supporting materials"
          />
        </UploadSection>
      </div>
    </div>
  );
}

function UploadSection({
  title,
  required,
  description,
  children,
}: {
  title: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Upload className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">{title}</span>
        {required ? (
          <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0">
            Required
          </Badge>
        ) : (
          <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0">
            Optional
          </Badge>
        )}
      </div>
      {description ? <p className="mb-3 text-[10px] text-muted-foreground">{description}</p> : null}
      {children}
    </div>
  );
}
