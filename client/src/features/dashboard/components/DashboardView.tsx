import { PageHeader } from "@/layouts/AppShell";
import { useRole, roleMeta } from "@/shared/lib/role";
import { currentUserByRole } from "@/entities";
import { AdminDash } from "./AdminDash";
import { MangakaDash } from "./MangakaDash";
import { EditorDash } from "./EditorDash";
import { AssistantDash } from "./AssistantDash";
import { BoardDash } from "./BoardDash";

export function DashboardView() {
  const { role, user } = useRole();
  const me = user || currentUserByRole[role];
  const m = roleMeta(role);
  const firstName = me?.name ? me.name.split(" ")[0] : "User";

  return (
    <div>
      {role !== "mangaka" && role !== "admin" && (
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
