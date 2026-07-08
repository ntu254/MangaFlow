import {
  MousePointer2,
  Pin,
  Square,
  FileText as Text,
  AlertOctagon,
  CheckCircle2,
  GitCompare,
  ZoomIn,
} from "lucide-react";

export type AnnotationTool =
  | "select"
  | "pin"
  | "draw"
  | "text"
  | "blocking"
  | "resolve"
  | "compare"
  | "zoom";

const TOOLS: Array<{ key: AnnotationTool; label: string; icon: React.ReactNode }> = [
  { key: "select", label: "Select", icon: <MousePointer2 className="size-3.5" /> },
  { key: "pin", label: "Pin", icon: <Pin className="size-3.5" /> },
  { key: "draw", label: "Draw", icon: <Square className="size-3.5" /> },
  { key: "text", label: "Note", icon: <Text className="size-3.5" /> },
  { key: "blocking", label: "Blocking", icon: <AlertOctagon className="size-3.5" /> },
  { key: "resolve", label: "Resolve", icon: <CheckCircle2 className="size-3.5" /> },
  { key: "compare", label: "Compare", icon: <GitCompare className="size-3.5" /> },
  { key: "zoom", label: "Zoom", icon: <ZoomIn className="size-3.5" /> },
];

export function AnnotationToolbar({
  active,
  onChange,
}: {
  active: AnnotationTool;
  onChange: (t: AnnotationTool) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5">
      {TOOLS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          title={t.label}
          className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold ${
            active === t.key ? "bg-foreground text-background" : "hover:bg-muted"
          }`}
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
