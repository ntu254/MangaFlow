import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { getChapter, approveChapter, requestChapterRevision, type Chapter } from "@/features/chapter/api/chapter";
import { listPages, createPage, deletePage, runBatchAIBubbleProcess, type Page } from "../api/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash, Plus, ChevronLeft, Image as ImageIcon, UploadCloud, X, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/shared/components/feedback/Toast";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";

export function ChapterPagesPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Page form state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditor = window.location.pathname.startsWith("/app/editor");
  const rolePath = isEditor ? "editor" : "mangaka";

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [batchAiLoading, setBatchAiLoading] = useState(false);

  async function handleApproveChapter() {
    if (!chapterId) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const updated = await approveChapter(token, chapterId);
      setChapter(updated);
      toast("Chapter approved successfully!", "success");
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Failed to approve chapter");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBatchAI() {
    if (!chapterId) return;
    try {
      setBatchAiLoading(true);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      toast("Running AI bubble processing on all pages…", "info");
      await runBatchAIBubbleProcess(token, chapterId);
      toast("Batch AI processing complete!", "success");
      // Refresh page list to reflect updated statuses
      const pgData = await listPages(token, chapterId);
      setPages(pgData);
    } catch (err: any) {
      console.error(err);
      toast(err.message || "Batch AI processing failed", "error");
    } finally {
      setBatchAiLoading(false);
    }
  }

  async function handleRequestChapterRevision() {
    if (!chapterId) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const updated = await requestChapterRevision(token, chapterId);
      setChapter(updated);
      toast("Chapter revision requested successfully!", "success");
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Failed to request chapter revision");
    } finally {
      setActionLoading(false);
    }
  }

  const loadData = useCallback(async () => {
    if (!chapterId) return;
    try {
      setIsLoading(true);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      const chData = await getChapter(token, chapterId);
      setChapter(chData);

      const pgData = await listPages(token, chapterId);
      setPages(pgData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load chapter pages");
    } finally {
      setIsLoading(false);
    }
  }, [chapterId, getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const newFiles = files
      .filter(f => validImageTypes.includes(f.type))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  async function handleAddPages(e: React.FormEvent) {
    e.preventDefault();
    if (!chapterId || selectedFiles.length === 0) return;
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      const formData = new FormData();
      selectedFiles.forEach(({ file }) => {
        formData.append("files", file);
      });

      await createPage(token, chapterId, formData);

      // Clean up object URLs
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]);
      setAddDialogOpen(false);
      
      // Reload pages
      const pgData = await listPages(token, chapterId);
      setPages(pgData);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to upload pages");
    } finally {
      setSubmitLoading(false);
    }
  }

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  async function handleDeletePage(pageId: string) {
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");

      await deletePage(token, pageId);
      setPages(prev => prev.filter(p => p.id !== pageId));
      toast("Page deleted successfully!", "success");
    } catch (err: any) {
      console.error(err);
      toast(err.message || "Failed to delete page", "error");
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "UPLOADED": return "secondary";
      case "AI_PROCESSED": return "default";
      case "REGION_MARKED": return "default";
      case "TASK_ASSIGNED": return "outline";
      case "IN_PROGRESS": return "outline";
      case "SUBMITTED": return "secondary";
      case "MANGAKA_APPROVED": return "default";
      case "EDITOR_APPROVED": return "default";
      case "NEEDS_REVISION": return "destructive";
      case "READY_TO_PUBLISH": return "default";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-5xl animate-pulse">
        <div className="h-6 w-1/4 bg-muted rounded mb-6" />
        <div className="h-10 w-1/2 bg-muted rounded mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="aspect-[3/4] bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="container py-8 max-w-5xl">
        <div className="text-destructive font-medium bg-destructive/10 p-4 rounded-md mb-4">
          {error || "Chapter not found"}
        </div>
        <Link to="/app/mangaka/series">
          <Button variant="outline">&larr; Back to Series</Button>
        </Link>
      </div>
    );
  }

  const backLink = isEditor ? "/app/editor/dashboard" : `/app/mangaka/series/${chapter.seriesId}`;

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to={backLink} 
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> {isEditor ? "Back to Dashboard" : "Back to Series Detail"}
        </Link>
      </div>

      {actionError && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-6">
          {actionError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ch. {chapter.chapterNumber}: {chapter.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status: <Badge variant="outline" className="ml-1">{chapter.status}</Badge>
          </p>
        </div>

        {isEditor ? (
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={handleRequestChapterRevision} 
              disabled={actionLoading || (chapter.status !== "READY_FOR_EDITOR" && chapter.status !== "EDITOR_REVIEW")}
            >
              Request Revision
            </Button>
            <Button 
              onClick={handleApproveChapter} 
              disabled={actionLoading || (chapter.status !== "READY_FOR_EDITOR" && chapter.status !== "EDITOR_REVIEW")}
            >
              Approve Chapter
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              id="btn-batch-ai"
              variant="outline"
              onClick={() => void handleBatchAI()}
              disabled={batchAiLoading || pages.length === 0}
              className="flex items-center gap-2"
            >
              {batchAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {batchAiLoading ? "Processing…" : "Batch AI"}
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={(open) => {
              if (!open && !submitLoading) {
                selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
                setSelectedFiles([]);
              }
              setAddDialogOpen(open);
            }}>
            <DialogTrigger>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Pages
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Chapter Pages</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPages} className="space-y-6 mt-4">
                {submitError && (
                  <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-md">
                    {submitError}
                  </div>
                )}

                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
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
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <UploadCloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground/80" />
                  <h3 className="font-semibold text-lg mb-1">Drag & drop page images here</h3>
                  <p className="text-sm text-muted-foreground mb-2">or click to browse from your device</p>
                  <p className="text-xs text-muted-foreground/60">Supports PNG, JPG, and WEBP. Max 50MB per file.</p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Selected Pages ({selectedFiles.length})</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[240px] overflow-y-auto p-1 border rounded-lg bg-muted/30">
                      {selectedFiles.map(({ file, preview }, idx) => (
                        <div key={idx} className="relative aspect-[3/4] rounded-md overflow-hidden bg-card border group">
                          <img src={preview} alt={file.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              type="button"
                              size="icon" 
                              variant="destructive" 
                              className="w-7 h-7 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(idx);
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 text-[9px] text-white truncate text-center">
                            Page {pages.length + idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full flex items-center justify-center gap-2" 
                  disabled={submitLoading || selectedFiles.length === 0}
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading & Processing ({selectedFiles.length} pages)...
                    </>
                  ) : (
                    `Upload ${selectedFiles.length} Page${selectedFiles.length > 1 ? "s" : ""}`
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {pages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {pages.map(page => (
            <div key={page.id} className="group relative border rounded-xl overflow-hidden bg-card hover:border-primary/50 transition-all flex flex-col">
              <div className="aspect-[3/4] w-full bg-muted flex items-center justify-center relative overflow-hidden">
                {page.thumbnailUrl || page.originalFileUrl ? (
                  <img 
                    src={page.thumbnailUrl || page.originalFileUrl} 
                    alt={`Page ${page.pageNumber}`} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                )}
                
                {/* Delete button overlay on hover */}
                {!isEditor && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="w-8 h-8 rounded-full shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(page.id);
                      }}
                      aria-label={`Delete page ${page.pageNumber}`}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <Link
                  to={`/app/${rolePath}/pages/${page.id}/workspace`}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Open workspace for page ${page.pageNumber}`}
                >
                  <span className="text-white text-xs font-semibold px-3 py-1.5 bg-primary rounded-md shadow">
                    Open Workspace
                  </span>
                </Link>
              </div>
              
              <div className="p-3 flex items-center justify-between border-t bg-background">
                <span className="font-semibold text-sm">Page {page.pageNumber}</span>
                <Badge variant={getStatusBadgeVariant(page.status)} className="text-[10px] px-1.5 py-0">
                  {page.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-medium text-lg mb-1">No Pages Uploaded</h3>
          <p className="text-sm max-w-xs mx-auto mb-6">
            {isEditor ? "No pages have been uploaded to this chapter yet." : "Start by adding page images to this chapter."}
          </p>
          {!isEditor && <Button onClick={() => setAddDialogOpen(true)}>Add First Page</Button>}
        </div>
      )}

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete Page"
        description="Are you sure you want to delete this page? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTargetId) handleDeletePage(deleteTargetId);
          setDeleteTargetId(null);
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
