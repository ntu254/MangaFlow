import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/editor/chapters/$chapterId/annotate")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/app/editor/chapters/$chapterId/review",
      params: { chapterId: params.chapterId },
    });
  },
});
