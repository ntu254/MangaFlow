import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SessionForm } from "@/features/board";
import { useAuth } from "@/shared/auth";

export const Route = createFileRoute("/app/board/sessions/new")({
  component: NewSessionPage,
});

function NewSessionPage() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  if (!user) return null;
  if (user.role !== "editor" && user.role !== "admin" && user.role !== "board") {
    return (
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="font-serif text-3xl">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          Only Editor, Board, or Admin users can create voting sessions.
        </p>
        <Link to="/app/board/sessions" className="text-xs underline">
          Back to sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link to="/app/board/sessions" className="text-[11px] text-muted-foreground underline">
          Back to voting sessions
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Create session</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select one proposal to open a Board voting session immediately.
        </p>
      </header>
      <SessionForm
        user={user}
        onCreated={(s) => navigate({ to: "/app/board/sessions/$sid", params: { sid: s.id } })}
      />
    </div>
  );
}
