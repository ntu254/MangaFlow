import {
  MousePointer2,
  Hand,
  Square,
  Hexagon,
  MessageCircle,
  Brush,
  Type,
  MessageSquare,
  Sparkles,
  Save,
} from "lucide-react";
import { useStudioStore, type Tool } from "./useStudioStore";

interface ToolItem {
  id: Tool;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut: string;
}

const TOOLS: ToolItem[] = [
  // Navigation
  { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { id: "pan", icon: Hand, label: "Pan Mode", shortcut: "H" },
  // Regions
  { id: "rect", icon: Square, label: "Rectangle Region", shortcut: "R" },
  { id: "polygon", icon: Hexagon, label: "Polygon Region", shortcut: "P" },
  { id: "bubble", icon: MessageCircle, label: "Speech Bubble", shortcut: "B" },
  // Annotations
  { id: "brush", icon: Brush, label: "Brush / Mask", shortcut: "K" },
  { id: "text", icon: Type, label: "Text Layer", shortcut: "T" },
  { id: "comment", icon: MessageSquare, label: "Add Comment", shortcut: "C" },
  // AI / Save
  { id: "ai", icon: Sparkles, label: "AI Segment", shortcut: "I" },
  { id: "save", icon: Save, label: "Save", shortcut: "S" },
];

export function HeaderToolBar() {
  const { activeTool, setActiveTool } = useStudioStore();

  const handleToolClick = (toolId: Tool) => {
    if (toolId === "save") {
      alert("Canvas changes saved to workspace.");
      return;
    }
    setActiveTool(toolId);
  };

  return (
    <div className="flex items-center gap-1 bg-foreground/[0.03] border border-border rounded-lg p-1 h-8.5 shadow-sm">
      {TOOLS.map((t, idx) => {
        const isDividerAfter = idx === 1 || idx === 4 || idx === 7 || idx === 8;
        const isActive = activeTool === t.id;

        return (
          <div key={t.id} className="flex items-center">
            <button
              title={`${t.label} (${t.shortcut})`}
              onClick={() => handleToolClick(t.id)}
              className={`flex h-6.5 w-6.5 items-center justify-center rounded transition-all ${
                isActive
                  ? "bg-foreground/10 text-foreground border border-border shadow-inner"
                  : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
            </button>
            {isDividerAfter && (
              <div className="mx-1 h-3.5 w-px bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
