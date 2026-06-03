import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/hooks/useAuth";
import { createManuscript } from "../api/manuscript";
import { UploadCloud, X, Loader2, FileText } from "lucide-react";

export function UploadManuscriptDialog({ seriesId, onUploadSuccess }: { seriesId: string; onUploadSuccess: () => void }) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;

      const formData = new FormData();
      if (title.trim()) {
        formData.append("title", title.trim());
      }
      selectedFiles.forEach(file => {
        formData.append("files", file);
      });

      await createManuscript(token, seriesId, formData);
      
      setOpen(false);
      setTitle("");
      setSelectedFiles([]);
      onUploadSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload manuscript");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o && !loading) {
        setSelectedFiles([]);
        setTitle("");
        setError(null);
      }
      setOpen(o);
    }}>
      <DialogTrigger>
        <Button variant="default">Upload Manuscript</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Manuscript</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md bg-background" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Chapter 1 Manuscript"
              required
            />
          </div>
          
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple
              accept="image/png, image/jpeg, image/webp, application/pdf"
              className="hidden" 
              onChange={handleFileChange}
            />
            <UploadCloud className="w-10 h-10 mx-auto mb-2 text-muted-foreground/80" />
            <p className="text-sm font-semibold">Drag & drop files here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP or PDF. Max 50MB.</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Selected Files ({selectedFiles.length})</label>
              <div className="space-y-1.5 max-h-[150px] overflow-y-auto border p-2 rounded-md bg-muted/20">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded bg-background border">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="w-5 h-5 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || selectedFiles.length === 0 || !title.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              "Submit Manuscript"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
