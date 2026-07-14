import { ProposalModel } from "../../../db/models.js";

export { ProposalModel };

export function findProposalById(proposalId: string) {
  return ProposalModel.findOne({ id: proposalId }).lean();
}

export function createProposalRecord(payload: Record<string, unknown>) {
  return ProposalModel.create(payload);
}
