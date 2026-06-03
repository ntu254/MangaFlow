import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface AddCommentFormProps {
  onSubmit: (content: string) => Promise<void>;
}

export function AddCommentForm({ onSubmit }: AddCommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    try {
      setSubmitting(true);
      await onSubmit(content.trim());
      setContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-4 border-t pt-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a new comment..."
        className="min-h-20 bg-background"
        maxLength={2000}
        disabled={submitting}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={!content.trim() || submitting} size="sm">
          {submitting ? (
            <Loader2 className="size-4 animate-spin mr-1" />
          ) : (
            <Send className="size-4 mr-1" />
          )}
          Send
        </Button>
      </div>
    </form>
  );
}
