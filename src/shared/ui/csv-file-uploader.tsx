import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface CsvFileUploaderProps {
  accept?: string;
  disabled?: boolean;
  onFileContent: (content: string, fileName: string) => void;
}

export function CsvFileUploader({
  accept = ".csv,text/csv",
  disabled = false,
  onFileContent,
}: CsvFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const readFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv") && !file.type.includes("csv")) {
        return;
      }
      setReading(true);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        onFileContent(text, file.name);
        setReading(false);
      };
      reader.onerror = () => setReading(false);
      reader.readAsText(file);
    },
    [onFileContent],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [disabled, readFile],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [readFile],
  );

  const handleClear = useCallback(() => {
    setFileName(null);
    onFileContent("", "");
  }, [onFileContent]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) inputRef.current?.click();
        }
      }}
      aria-label="Drop a CSV file here, or click to browse"
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
        disabled && "cursor-not-allowed opacity-40",
        dragging
          ? "border-foreground bg-muted/50"
          : "border-border hover:border-foreground/30 hover:bg-muted/30",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        tabIndex={-1}
        aria-label="Upload CSV file"
      />
      {reading ? (
        <Loader2 className="size-5 text-muted-foreground animate-spin" />
      ) : fileName ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <FileText className="size-4 text-foreground" />
          <span className="text-xs font-medium text-foreground">{fileName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Remove file"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          <Upload className="size-5 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-foreground">
              Drop a CSV file here, or click to browse
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Accepts .csv files up to 5 MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}
