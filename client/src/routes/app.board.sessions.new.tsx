import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/shared/auth";
import { SessionForm } from "@/features/board";

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
        <h1 className="font-serif text-3xl">Không có quyền</h1>
        <p className="text-sm text-muted-foreground">
          Chỉ Editor, Board hoặc Admin có thể tạo session.
        </p>
        <Link to="/app/board/sessions" className="text-xs underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link to="/app/board/sessions" className="text-[11px] text-muted-foreground underline">
          ← Voting sessions
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Tạo session mới</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ad-hoc dung cho 1 proposal can vote ngay. Lich hop dinh kem nhieu proposal theo lich
          Board.
        </p>
      </header>
      <SessionForm
        user={user}
        onCreated={(s) => navigate({ to: "/app/board/sessions/$sid", params: { sid: s.id } })}
      />
    </div>
  );
}
