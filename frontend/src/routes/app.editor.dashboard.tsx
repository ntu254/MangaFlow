import { createFileRoute } from "@tanstack/react-router";
import { EditorDashboard } from "@/features/editor/dashboard";

export const Route = createFileRoute("/app/editor/dashboard")({
  head: () => ({
    meta: [
      { title: "Editor Dashboard — MangaFlow Studio" },
      { name: "description", content: "Today review focus, queue summary, deadline risk." },
    ],
  }),
  component: EditorDashboard,
});
