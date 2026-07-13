import { useState } from "react";
import { toast } from "sonner";
import type { User } from "@/shared/auth";
import { useAddVotingSessionNoteMutation } from "../../api/board-queries";
import type { VotingSession } from "@/entities/board/model/voting-types";
import { Textarea } from "@/components/ui/textarea";

export function SessionNotes({ session, user: _user }: { session: VotingSession; user: User }) {
  const addNoteMutation = useAddVotingSessionNoteMutation(session.id);
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) {
      toast.error("Note is empty.");
      return;
    }
    try {
      await addNoteMutation.mutateAsync({ text: text.trim() });
      setText("");
      toast.success("Note added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add note.");
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card/40 p-4">
      <h2 className="mb-3 font-serif text-xl">Session notes ({session.notes.length})</h2>
      {session.notes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {session.notes.map((n) => (
            <li key={n.id} className="rounded border border-border/60 bg-background p-2 text-xs">
              <p className="font-semibold">{n.authorName}</p>
              <p className="text-foreground/85">{n.text}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString("vi-VN")}
              </p>
            </li>
          ))}
        </ul>
      )}
      {session.status === "OPEN" ? (
        <div className="mt-3 flex flex-col gap-2">
          <Textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a note for the session..."
          />
          <button
            onClick={submit}
            disabled={addNoteMutation.isPending}
            className="self-end rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
          >
            Send
          </button>
        </div>
      ) : null}
    </section>
  );
}
