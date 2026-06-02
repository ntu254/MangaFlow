import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { getChapter, type Chapter } from "@/features/chapter/api/chapter";
import { listPages, createPage, deletePage, type Page } from "../api/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash, Plus, ChevronLeft, Image as ImageIcon } from "lucide-react";

export function ChapterPagesPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { getToken } = useAuth();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Page form state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState("");
  const [originalFileUrl, setOriginalFileUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!chapterId) return;
    try {
      setIsLoading(true);
      const token = await getToken();
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

  async function handleAddPage(e: React.FormEvent) {
    e.preventDefault();
    if (!chapterId) return;
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const num = Number(pageNumber);
      if (isNaN(num) || num <= 0) {
        throw new Error("Page number must be a valid positive number");
      }
      if (!originalFileUrl.trim()) {
        throw new Error("Page Image URL is required");
      }

      await createPage(token, chapterId, {
        pageNumber: num,
        originalFileUrl: originalFileUrl.trim(),
        width: 1200,
        height: 1600
      });

      setAddDialogOpen(false);
      setPageNumber("");
      setOriginalFileUrl("");
      
      // Reload pages
      const pgData = await listPages(token, chapterId);
      setPages(pgData);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to add page");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeletePage(pageId: string) {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await deletePage(token, pageId);
      setPages(prev => prev.filter(p => p.id !== pageId));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete page");
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

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to={`/app/mangaka/series/${chapter.seriesId}`} 
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Series Detail
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ch. {chapter.chapterNumber}: {chapter.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status: <Badge variant="outline" className="ml-1">{chapter.status}</Badge>
          </p>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Page (Mock)</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddPage} className="space-y-4 mt-4">
              {submitError && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                  {submitError}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Page Number</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-md bg-background" 
                  value={pageNumber} 
                  onChange={e => setPageNumber(e.target.value)} 
                  placeholder="e.g. 1"
                  required
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Page Image URL</label>
                <input 
                  type="url" 
                  className="w-full p-2 border rounded-md bg-background" 
                  value={originalFileUrl} 
                  onChange={e => setOriginalFileUrl(e.target.value)} 
                  placeholder="https://images.unsplash.com/photo-..."
                  required
                />
                <p className="text-xs text-muted-foreground">Provide a link to an image file.</p>
              </div>
              <Button type="submit" className="w-full" disabled={submitLoading || !pageNumber || !originalFileUrl.trim()}>
                {submitLoading ? "Adding..." : "Add Page"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {pages.map(page => (
            <div key={page.id} className="group relative border rounded-xl overflow-hidden bg-card hover:border-primary/50 transition-all flex flex-col">
              <div className="aspect-[3/4] w-full bg-muted flex items-center justify-center relative overflow-hidden">
                {page.originalFileUrl ? (
                  <img 
                    src={page.originalFileUrl} 
                    alt={`Page ${page.pageNumber}`} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                )}
                
                {/* Delete button overlay on hover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="w-8 h-8 rounded-full shadow-md"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>

                {/* Workspace annotation redirect placeholder */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => alert("Workspace Annotation editor coming soon in EPIC-08!")}>
                  <span className="text-white text-xs font-semibold px-3 py-1.5 bg-primary rounded-md shadow">Open Workspace</span>
                </div>
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
          <p className="text-sm max-w-xs mx-auto mb-6">Start by adding page images to this chapter.</p>
          <Button onClick={() => setAddDialogOpen(true)}>Add First Page</Button>
        </div>
      )}
    </div>
  );
}
