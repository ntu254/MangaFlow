import {
  Hand,
  Maximize,
  MessageSquarePlus,
  Minus,
  MousePointer2,
  Plus as PlusIcon,
  Sparkles,
  Square,
  Type,
  UploadCloud,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { StudioTool } from "@/entities/series/model/studio-types";
import type { StudioPermissionSet } from "../../model/studio-permissions";

type Props = {
  tool: StudioTool;
  onToolChange: (t: StudioTool) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  permissions: StudioPermissionSet;
  canSubmitWork?: boolean;
  onSubmitWork?: () => void;
  canRunAi?: boolean;
  aiBusy?: boolean;
  onDetectBubbles?: () => void;
  onWhitenBubbles?: () => void;
};

const TOOLS: {
  id: StudioTool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "pan", label: "Pan", icon: Hand },
  { id: "draw-region", label: "Draw Region", icon: Square },
  { id: "comment", label: "Comment", icon: MessageSquarePlus },
];

export function BottomStudioToolbar({
  tool,
  onToolChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  permissions,
  canSubmitWork = false,
  onSubmitWork,
  canRunAi = false,
  aiBusy = false,
  onDetectBubbles,
  onWhitenBubbles,
}: Props) {
  const tools = TOOLS.filter((t) => permissions.allowedTools.includes(t.id));

  return (
    <TooltipProvider delayDuration={200}>
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-border bg-card/95 px-1.5 py-1 shadow-lg backdrop-blur">
        {tools.map((t) => {
          const Icon = t.icon;
          const active = tool === t.id;
          return (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onToolChange(t.id)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                    active
                      ? "bg-foreground text-background ring-2 ring-foreground/30"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t.label}</TooltipContent>
            </Tooltip>
          );
        })}

        {permissions.canSubmitTask ? (
          <>
            <Divider />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled={!canSubmitWork}
                  onClick={onSubmitWork}
                  className={`flex h-8 items-center gap-1 rounded-md px-2 text-[11px] font-bold transition ${
                    canSubmitWork
                      ? "bg-accent text-accent-foreground shadow-sm hover:opacity-90"
                      : "bg-muted text-muted-foreground opacity-60"
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  Submit Work
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {canSubmitWork
                  ? "Submit selected assigned task"
                  : "Select one of your assigned tasks"}
              </TooltipContent>
            </Tooltip>
          </>
        ) : null}

        {permissions.mode === "mangaka" ? (
          <>
            <Divider />
            <AiTool
              icon={<Sparkles className="h-4 w-4" />}
              label={aiBusy ? "Running AI" : "Detect Speech Bubbles"}
              disabled={!canRunAi || aiBusy}
              onClick={onDetectBubbles}
            />
            <AiTool
              icon={<Type className="h-4 w-4" />}
              label={aiBusy ? "Running AI" : "Text Whitening"}
              disabled={!canRunAi || aiBusy}
              onClick={onWhitenBubbles}
            />
          </>
        ) : null}

        <Divider />

        <button
          onClick={onZoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-11 text-center text-[11px] font-semibold tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onFit}
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Fit page</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-border" />;
}

function AiTool({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={disabled ? 0 : undefined}>
          <button
            disabled={disabled}
            aria-label={label}
            onClick={onClick}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              disabled ? "text-muted-foreground opacity-60" : "text-foreground hover:bg-muted"
            }`}
          >
            {icon}
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{disabled ? "Select a page with an uploaded file" : label}</TooltipContent>
    </Tooltip>
  );
}
