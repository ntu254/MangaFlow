import { Download, FileText, Image as ImageIcon, FileArchive, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/shadcn/dialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string;
  fileType?: string; // Mime type or extension
}

export function FilePreviewModal({ isOpen, onClose, fileUrl, fileName, fileType }: Props) {
  const [loading, setLoading] = useState(true);

  // Reset loading status when url changes
  useEffect(() => {
    if (fileUrl) {
      setLoading(true);
    }
  }, [fileUrl]);

  if (!fileUrl) return null;

  // Determine file type from extension or mime type
  const lowerName = fileName.toLowerCase();
  const isImage =
    (fileType && fileType.startsWith("image/")) ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".webp") ||
    lowerName.endsWith(".gif");

  const isPdf = (fileType && fileType === "application/pdf") || lowerName.endsWith(".pdf");

  const isZip =
    lowerName.endsWith(".zip") ||
    lowerName.endsWith(".rar") ||
    lowerName.endsWith(".tar") ||
    lowerName.endsWith(".gz");

  const handleDownload = () => {
    const anchor = document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = fileName;
    anchor.click();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl w-[90vw] p-6 max-h-[90vh] flex flex-col overflow-hidden bg-background border border-border rounded-xl shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 shrink-0 mr-6">
          <div className="min-w-0 pr-4">
            <DialogTitle className="text-base font-bold text-foreground truncate flex items-center gap-2">
              {isImage && <ImageIcon className="h-4 w-4 text-primary shrink-0" />}
              {isPdf && <FileText className="h-4 w-4 text-destructive shrink-0" />}
              {!isImage && !isPdf && (
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="truncate">{fileName}</span>
            </DialogTitle>
          </div>
          <button
            onClick={handleDownload}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:translate-y-px transition-all shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/30 rounded-lg border border-border/50 relative overflow-auto flex items-center justify-center p-2 mt-4">
          {loading && (isImage || isPdf) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
              className="max-w-full max-h-[65vh] object-contain rounded shadow"
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={fileName}
              onLoad={() => setLoading(false)}
              className="w-full h-[65vh] rounded"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                {isZip ? <FileArchive className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
              </div>
              <h3 className="text-base font-bold text-foreground">Preview Not Available</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                We can only preview images and PDF files directly. Please click the button below to
                download and view this file.
              </p>
              <button
                onClick={handleDownload}
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 active:translate-y-px transition cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download File
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
