import type { SeriesProposal } from "./proposal-types";

export function decisionEffect(
  proposal: SeriesProposal,
  decision?: "APPROVE" | "REJECT" | "NEEDS_REVISION" | "ABSTAIN",
) {
  if (!decision) return "Chọn quyết định để xem tác động.";
  if (decision === "APPROVE")
    return `${proposal.title} có thể chuyển sang slate serialization nếu quorum đạt.`;
  if (decision === "NEEDS_REVISION")
    return `${proposal.title} sẽ quay lại Editor/Mangaka với yêu cầu chỉnh sửa.`;
  if (decision === "ABSTAIN")
    return "Abstain ghi nhận ý kiến nhưng không tăng approve/reject quorum.";
  return `${proposal.title} có thể bị từ chối nếu reject đạt quorum.`;
}
