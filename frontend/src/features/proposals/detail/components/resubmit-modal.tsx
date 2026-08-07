import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { User } from "@/shared/auth";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { ProposalWizard } from "../../create/components/proposal-wizard";
import type { ResolvedItemState } from "./resubmit-checklist-editor";

export function ResubmitModal({
  proposal,
  user: _user,
  open,
  onClose,
  onResubmit,
}: {
  proposal: SeriesProposal;
  user: User;
  open: boolean;
  onClose: () => void;
  onResubmit?: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  const openChange = useMemo(
    () => [...proposal.requestedChanges].reverse().find((change) => !change.resolvedAt) ?? null,
    [proposal.requestedChanges],
  );
  const [resolvedItems, setResolvedItems] = useState<Record<string, ResolvedItemState>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (
    values: Record<string, unknown>,
    meta?: { resolvedItems: Record<string, ResolvedItemState>; comment?: string },
  ) => {
    if (!openChange) {
      toast.error("No open change request found.");
      return;
    }
    const missing = openChange.items.filter((item) => !meta?.resolvedItems?.[item.id]?.resolved);
    if (missing.length > 0) {
      toast.error(`${missing.length} item(s) still unresolved.`);
      return;
    }

    setSubmitting(true);
    try {
      await onResubmit?.({
        ...values,
        resolvedItems: meta?.resolvedItems ?? {},
        comment: meta?.comment ?? (values.submissionNote || undefined),
      });
      toast.success("All changes saved and resubmitted to Editor.");
      onClose();
      setResolvedItems({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resubmit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={(value) => !value && onClose()}>
      <ModalContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
        <ModalHeader>
          <ModalTitle>Edit and Resubmit Proposal</ModalTitle>
        </ModalHeader>

        <ProposalWizard
          mode="edit"
          initialProposal={proposal}
          resubmit={{ change: openChange }}
          submitLabel={submitting ? "Resubmitting..." : "Save changes & resubmit"}
          onCancel={onClose}
          onSave={async (values, meta) => {
            if (!submitting) await submit(values, meta);
          }}
        />
      </ModalContent>
    </Modal>
  );
}

// Alias export
export { ResubmitModal as ResubmitDialog };
