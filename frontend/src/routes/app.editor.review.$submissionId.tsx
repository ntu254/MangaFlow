import { createFileRoute } from "@tanstack/react-router";
import { EditorSubmissionReview } from "@/features/editor/submission-review";

export const Route = createFileRoute("/app/editor/review/$submissionId")({
  head: () => ({
    meta: [{ title: "Review Submission — MangaFlow Studio" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { submissionId } = Route.useParams();
  return <EditorSubmissionReview submissionId={submissionId} />;
}
