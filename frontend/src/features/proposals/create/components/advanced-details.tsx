import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/cn";

export type AdvancedDetailsValues = {
  worldSetting?: string;
  seriesDirection?: string;
  productionPlan?: string;
  assistantNeeds?: string;
  comparableTitles?: string;
  aiDisclosure?: string;
};

const FIELDS: { key: keyof AdvancedDetailsValues; label: string; placeholder: string }[] = [
  {
    key: "worldSetting",
    label: "World setting",
    placeholder: "World, era, special rules...",
  },
  {
    key: "seriesDirection",
    label: "Series direction",
    placeholder: "Planned arcs, tone, length...",
  },
  {
    key: "productionPlan",
    label: "Production plan",
    placeholder: "Cadence, chapters per month...",
  },
  {
    key: "assistantNeeds",
    label: "Assistant needs",
    placeholder: "Background, tone, ink, screentone...",
  },
  {
    key: "comparableTitles",
    label: "Comparable titles",
    placeholder: "E.g.: Vinland Saga, Vagabond...",
  },
  {
    key: "aiDisclosure",
    label: "AI / tools used",
    placeholder: "Any AI or tools used for assistance? (if applicable)",
  },
];

export function AdvancedDetails({
  values,
  onChange,
  defaultOpen = false,
}: {
  values: AdvancedDetailsValues;
  onChange: (v: AdvancedDetailsValues) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-dashed border-border bg-card/30"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
        <span>Advanced details (optional)</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-4 pb-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {f.label}
            </Label>
            <Textarea
              rows={2}
              placeholder={f.placeholder}
              value={values[f.key] ?? ""}
              onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
