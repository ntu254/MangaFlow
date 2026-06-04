import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crosshair,
  MessageSquare,
  Loader2,
  Save,
  MousePointer2,
  Trash
} from "lucide-react";
import type { Region, RegionType } from "@/features/region/api/region";
import { regionTypes } from "@/features/region/api/region";
import type { NormalizedRegionBox } from "@/features/region/lib/region-workspace";
import { regionColorByType } from "./RegionOverlay";

export type WorkspaceToolMode = "REGION" | "ANNOTATION";

export type RegionsTabContentProps = {
  isEditor: boolean;
  toolMode: WorkspaceToolMode;
  setToolMode: (mode: WorkspaceToolMode) => void;
  selectedType: RegionType;
  setSelectedType: (type: RegionType) => void;
  annotationComment: string;
  setAnnotationComment: (comment: string) => void;
  draftBox: NormalizedRegionBox | null;
  setDraftBox: (box: NormalizedRegionBox | null) => void;
  saving: boolean;
  handleSaveDraft: () => Promise<void>;
  regions: Region[];
  filteredRegions: Region[];
  selectedRegionId: string | null;
  setSelectedRegionId: (id: string | null) => void;
  filterType: RegionType | "ALL";
  setFilterType: (type: RegionType | "ALL") => void;
  setActiveTab: (tab: string) => void;
  setConfirmDelete: (confirm: { type: "region"; id: string } | null) => void;
};

export function RegionsTabContent({
  isEditor,
  toolMode,
  setToolMode,
  selectedType,
  setSelectedType,
  annotationComment,
  setAnnotationComment,
  draftBox,
  setDraftBox,
  saving,
  handleSaveDraft,
  regions,
  filteredRegions,
  selectedRegionId,
  setSelectedRegionId,
  filterType,
  setFilterType,
  setActiveTab,
  setConfirmDelete
}: RegionsTabContentProps) {
  return (
    <div className="space-y-4">
      {!isEditor && (
        <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2f243a]">Workspace tool</span>
            <span className="text-[10px] text-muted-foreground">Drag on the page to draw</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant={toolMode === "REGION" ? "default" : "outline"}
              onClick={() => {
                setToolMode("REGION");
                setDraftBox(null);
              }}
              className="text-xs h-8 px-2"
            >
              <Crosshair className="size-3.5 mr-1" /> Region
            </Button>
            <Button
              type="button"
              size="sm"
              variant={toolMode === "ANNOTATION" ? "default" : "outline"}
              onClick={() => {
                setToolMode("ANNOTATION");
                setDraftBox(null);
              }}
              className="text-xs h-8 px-2"
            >
              <MessageSquare className="size-3.5 mr-1" /> Annotation
            </Button>
          </div>

          {toolMode === "REGION" ? (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</span>
              <div className="flex flex-wrap gap-1">
                {regionTypes.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="xs"
                    variant={selectedType === type ? "default" : "outline"}
                    onClick={() => setSelectedType(type)}
                    className="text-[10px] h-7 px-2 font-medium"
                  >
                    <span
                      className="size-1.5 rounded-full mr-1.5 shrink-0"
                      style={{ backgroundColor: regionColorByType[type] }}
                      aria-hidden="true"
                    />
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Review Comment</span>
              <textarea
                value={annotationComment}
                onChange={(event) => setAnnotationComment(event.target.value)}
                className="w-full min-h-12 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none transition-colors focus-visible:border-ring"
                placeholder="Dialogue bubble needs revision"
                maxLength={1000}
              />
            </div>
          )}

          {draftBox ? (
            <div className="rounded-lg border bg-[#f8f1ff]/20 p-2.5 text-xs space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#5f5270]">
                <span>Draft Coordinates</span>
                <span>
                  {Math.round(draftBox.x * 1000)}, {Math.round(draftBox.y * 1000)} &middot; {Math.round(draftBox.width * 1000)} &times; {Math.round(draftBox.height * 1000)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void handleSaveDraft()} disabled={saving} size="xs" className="flex-1 bg-[#9065d5] hover:bg-[#7f55c7] text-[10px] h-7">
                  {saving ? <Loader2 className="animate-spin size-3 mr-1" /> : <Save className="size-3 mr-1" />} Save
                </Button>
                <Button variant="outline" size="xs" onClick={() => setDraftBox(null)} disabled={saving} className="flex-1 text-[10px] h-7">
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-2 text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
              <MousePointer2 className="size-3" />
              No draft region selected
            </div>
          )}
        </section>
      )}

      <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#2f243a]">Regions</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{regions.length}</Badge>
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          <Button
            size="xs"
            variant={filterType === "ALL" ? "default" : "outline"}
            onClick={() => setFilterType("ALL")}
            className="text-[10px] h-6 px-2 rounded-full shrink-0 font-medium"
          >
            All
          </Button>
          {regionTypes.map((type) => (
            <Button
              key={type}
              size="xs"
              variant={filterType === type ? "default" : "outline"}
              onClick={() => setFilterType(type)}
              className="text-[10px] h-6 px-2 rounded-full shrink-0 font-medium"
            >
              <span
                className="size-1 rounded-full mr-1 shrink-0"
                style={{ backgroundColor: regionColorByType[type] }}
              />
              {type}
            </Button>
          ))}
        </div>

        {filteredRegions.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground text-center">
            No regions match this filter.
          </p>
        ) : (
          <div className="grid gap-2">
            {filteredRegions.map((region) => {
              const index = regions.findIndex((r) => r.id === region.id);
              const isSelected = selectedRegionId === region.id;
              return (
                <div
                  key={region.id}
                  className={`rounded-lg border p-2.5 transition-all ${
                    isSelected ? "border-[#9065d5] bg-[#f8f1ff]/40 shadow-sm" : "border-[#eadff6]/50 bg-white hover:bg-[#fffcfd]"
                  }`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left focus:outline-none"
                    onClick={() => setSelectedRegionId(region.id)}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2f243a]">
                      <span
                        className="size-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: regionColorByType[region.type] }}
                        aria-hidden="true"
                      />
                      {region.type} #{index + 1}
                      <span className="text-muted-foreground font-normal">&middot; {region.source}</span>
                    </span>
                  </button>

                  {isSelected && (
                    <div className="mt-2 space-y-2">
                      <div className="text-[10px] font-mono text-[#5f5270]">
                        {Math.round(region.x * 1000)}, {Math.round(region.y * 1000)} &middot; {Math.round(region.width * 1000)} &times; {Math.round(region.height * 1000)}
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setActiveTab("task")}
                          className="text-[10px] h-6 flex-1 bg-white border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff] py-0 px-2 font-medium"
                        >
                          Assign Task
                        </Button>
                        {!isEditor && (
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => setConfirmDelete({ type: "region", id: region.id })}
                            className="text-[10px] h-6 px-2 py-0"
                          >
                            <Trash className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
