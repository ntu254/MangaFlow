import { useState } from "react";
import { toast } from "sonner";
import type { ChapterPerms } from "../../lib/chapterPermissions";

export function CommentsTab({ perms }: { perms: ChapterPerms }) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      <div className="rounded border border-dashed border-foreground/15 p-6 text-center text-[12px] text-foreground/55">
        No comments yet — open a page, task, or submission to start a thread.
      </div>
      {perms.canComposeComment && (
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment on this chapter…"
            rows={2}
            className="min-h-[60px] flex-1 rounded-md border border-foreground/15 bg-transparent p-2 text-[12px]"
          />
          <button
            disabled={!text.trim()}
            onClick={() => {
              toast.success("Comment posted.");
              setText("");
            }}
            className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}
