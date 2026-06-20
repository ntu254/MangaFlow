import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/series/$id/publication")({
  component: () => (
    <div className="p-8 text-center text-foreground/50 border border-foreground/10 rounded-xl mt-4">
      Publication Workspace (Coming Soon)
    </div>
  ),
});
