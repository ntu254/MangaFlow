import type { Region, RegionType } from "@/features/region/api/region";
import type { Annotation } from "@/features/annotation/api/annotation";
import { regionBoxToStyle } from "@/features/region/lib/region-workspace";

export const regionColorByType: Record<RegionType, string> = {
  BACKGROUND: "#9065d5",
  INKING: "#2f243a",
  SCREENTONE: "#ffc95e",
  CLEANUP: "#ff7196",
  EFFECT: "#ff9971",
  BUBBLE: "#e560bc",
  OTHER: "#5f5270"
};

export function RegionOverlay({
  region,
  selected,
  onSelect
}: {
  region: Region;
  selected: boolean;
  onSelect: (region: Region) => void;
}) {
  const color = regionColorByType[region.type];

  return (
    <button
      type="button"
      aria-label={`${region.type} region`}
      className="absolute rounded-[3px] border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{
        ...regionBoxToStyle(region),
        borderColor: color,
        backgroundColor: selected ? `${color}40` : `${color}20`,
        boxShadow: selected ? `0 0 0 2px white, 0 0 0 5px ${color}` : "0 8px 20px rgba(47,36,58,0.12)"
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(region);
      }}
    >
      <span
        className="absolute left-1 top-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {region.type}
      </span>
    </button>
  );
}

export function AnnotationOverlay({
  annotation,
  selected,
  onSelect
}: {
  annotation: Annotation;
  selected: boolean;
  onSelect: (annotation: Annotation) => void;
}) {
  const color = annotation.status === "RESOLVED" ? "#8a7a99" : "#ff7196";

  return (
    <button
      type="button"
      aria-label={`${annotation.status.toLowerCase()} annotation`}
      className="absolute rounded-[3px] border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{
        ...regionBoxToStyle(annotation),
        borderColor: color,
        backgroundColor: selected ? `${color}35` : `${color}18`,
        boxShadow: selected ? `0 0 0 2px white, 0 0 0 5px ${color}` : "0 8px 20px rgba(47,36,58,0.10)"
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(annotation);
      }}
    >
      <span
        className="absolute right-1 top-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {annotation.status}
      </span>
    </button>
  );
}
