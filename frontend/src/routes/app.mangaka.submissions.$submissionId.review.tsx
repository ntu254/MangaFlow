import { createFileRoute } from "@tanstack/react-router";
import { SubmissionReview } from "@/features/mangaka/reviews";

export const Route = createFileRoute("/app/mangaka/submissions/$submissionId/review")({
  head: () => ({
    meta: [
      { title: "Mangaka Submission Review - MangaFlow Studio" },
      { name: "description", content: "Submission detail for Mangaka review." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { submissionId } = Route.useParams();
  return <SubmissionReview submissionId={submissionId} />;
}
