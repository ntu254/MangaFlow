import type { EditorAnnotation } from "../../model/editor-annotations-store";

export function EditorPageCanvas({
  annotations,
  selectedId,
  onCanvasClick,
  onSelect,
}: {
  annotations: EditorAnnotation[];
  selectedId?: string;
  onCanvasClick: (xRel: number, yRel: number) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      onClick={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        onCanvasClick(x, y);
      }}
      className="relative aspect-[3/4] w-full cursor-crosshair overflow-hidden rounded-md border border-border bg-gradient-to-br from-muted/40 to-muted/10"
    >
      <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
        Click to add pin
      </div>
      {annotations.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(a.id);
          }}
          style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[10px] font-bold shadow ${
            a.blocking ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
          } ${selectedId === a.id ? "ring-2 ring-foreground" : ""}`}
        >
          #{a.id.slice(-3)}
        </button>
      ))}
    </div>
  );
}
