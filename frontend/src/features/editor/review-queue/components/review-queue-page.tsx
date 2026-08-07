import { useMemo } from "react";
import { useAuth } from "@/shared/auth";
import { useProposalsQuery } from "@/features/proposals";
import { buildReviewQueue } from "../../model/editor-access";
import { ReviewItemsPanel } from "./review-items-panel";

export function ReviewQueuePage() {
  const user = useAuth((s) => s.user);
  const { data: proposals = [] } = useProposalsQuery();

  const items = useMemo(() => {
    if (!user) return [];
    return buildReviewQueue(proposals, [], [], [], user.id).filter(
      (item) => item.kind === "PROPOSAL_PACKAGE",
    );
  }, [user, proposals]);

  if (!user) return null;

  return (
    <ReviewItemsPanel
      eyebrow="Editorial"
      title="Proposal Reviews"
      description="Proposals submitted by mangaka, awaiting editorial review before moving to the Board."
      items={items}
    />
  );
}
