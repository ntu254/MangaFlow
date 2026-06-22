import { PageHeader } from "@/layouts/AppShell";
import { useRole, roleMeta } from "@/shared/lib/role";
import { currentUserByRole } from "@/entities";
import { AdminDash } from "./AdminDash";
import { MangakaDash } from "./MangakaDash";
import { EditorDash } from "./EditorDash";
import { AssistantDash } from "./AssistantDash";
import { BoardDash } from "./BoardDash";

export function DashboardView() {
  const { role, user, loading } = useRole();
  const me = user || currentUserByRole[role];
  const m = roleMeta(role);
  const firstName = me?.name ? me.name.split(" ")[0] : "User";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-md border border-foreground/10 bg-card" />
        <div className="grid gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-md border border-foreground/10 bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {role !== "mangaka" && role !== "admin" && role !== "board" && (
        <PageHeader
          title={`Welcome, ${firstName}`}
          jp={m.jp}
          description={`Signed in as ${m.label}. Switch role from the top bar to demo a different view.`}
        />
      )}
      {role === "admin" && <AdminDash />}
      {role === "mangaka" && <MangakaDash />}
      {role === "editor" && <EditorDash />}
      {role === "assistant" && <AssistantDash />}
      {role === "board" && <BoardDash />}
    </div>
  );
}
