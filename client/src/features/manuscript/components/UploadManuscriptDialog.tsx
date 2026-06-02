import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/react";
import { createManuscript } from "../api/manuscript";

export function UploadManuscriptDialog({ seriesId, onUploadSuccess }: { seriesId: string; onUploadSuccess: () => void }) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      
      const fileUrls = urls.split("\n").map(u => u.trim()).filter(Boolean);
      await createManuscript(token, seriesId, { title, fileUrls });
      
      setOpen(false);
      setTitle("");
      setUrls("");
      onUploadSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to upload manuscript");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="default">Upload Manuscript</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Manuscript (Mock)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md bg-background" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Chapter 1 Draft"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">File URLs (one per line)</label>
            <textarea 
              className="w-full p-2 border rounded-md bg-background min-h-[100px]" 
              value={urls} 
              onChange={e => setUrls(e.target.value)} 
              placeholder="https://example.com/page1.jpg&#10;https://example.com/page2.jpg"
              required
            />
            <p className="text-xs text-muted-foreground">This is a mock upload. Enter direct URLs to images or PDFs.</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !urls.trim()}>
            {loading ? "Uploading..." : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
