import { useState } from "react";
import { Upload } from "lucide-react";

export function Dropzone({ onFile }: { onFile: (f: File) => void }) {
  const [over, setOver] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`flex h-72 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center transition ${
        over ? "border-primary bg-primary/5" : "border-foreground/20 bg-foreground/5"
      }`}
    >
      <Upload className="h-6 w-6 text-foreground/50" />
      <div className="text-sm font-medium">Drop a manuscript page</div>
      <div className="text-[11px] text-foreground/55">
        PNG/JPG · single page · sends directly to your AI service
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}
