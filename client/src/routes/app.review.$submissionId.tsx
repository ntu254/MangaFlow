import { createFileRoute } from "@tanstack/react-router";
import { SubmissionReview } from "@/features/mangaka/reviews";

export const Route = createFileRoute("/app/review/$submissionId")({
  head: () => ({
    meta: [
      { title: "Review Submission — beachRead Studio" },
      { name: "description", content: "Submission detail awaiting Mangaka review." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { submissionId } = Route.useParams();
  return <SubmissionReview submissionId={submissionId} />;
}
