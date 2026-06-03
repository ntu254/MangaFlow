import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/shared/hooks/useAuth";
import { createChapter } from "../api/chapter";

export function CreateChapterDialog({ 
  seriesId, 
  onSuccess 
}: { 
  seriesId: string; 
  onSuccess: () => void; 
}) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "mangaflow" });
      if (!token) return;

      const num = Number(chapterNumber);
      if (isNaN(num) || num <= 0) {
        throw new Error("Chapter number must be a valid positive number");
      }
      if (!title.trim()) {
        throw new Error("Title is required");
      }

      await createChapter(token, seriesId, {
        title: title.trim(),
        chapterNumber: num,
        deadline: deadline || undefined
      });

      setOpen(false);
      setTitle("");
      setChapterNumber("");
      setDeadline("");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create chapter");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="default">Create Chapter</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Chapter</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="chapterNumber">Chapter Number</Label>
            <Input
              id="chapterNumber"
              type="number"
              value={chapterNumber}
              onChange={e => setChapterNumber(e.target.value)}
              placeholder="e.g. 1"
              required
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. The Beginning of Flow"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !title.trim() || !chapterNumber}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
