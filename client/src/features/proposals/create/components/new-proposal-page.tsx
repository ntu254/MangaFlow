import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { PageHeader } from "@/shared/ui";
import { ProposalWizard } from "./proposal-wizard";

export function NewProposalPage() {
  const user = useAuth((s) => s.user);

  if (!user) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user.role !== "mangaka") {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <ShieldAlert className="mx-auto mb-4 size-10 text-muted-foreground" />
        <h2 className="font-serif text-2xl">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only Mangaka accounts can create new series proposals.
        </p>
        <Link
          to="/app/submissions"
          className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground underline hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back to submissions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <Link
        to="/app/submissions"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Submissions
      </Link>
      <PageHeader
        eyebrow="Mangaka workflow"
        title="New series proposal"
        description="Complete three steps to submit your proposal for editor review."
      />
      <ProposalWizard mode="create" />
    </div>
  );
}
