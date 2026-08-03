# Voting session 3/5 design

## Goal

Make Board voting immediate and deterministic: no schedule selection, and a decision requires three votes for the same outcome from the five eligible Board members.

## Scope

- Remove `scheduledFor` and `closesAt` controls from the voting-session form. A session opens immediately and the Board Chair closes it manually.
- Keep the existing five eligible Board members and quorum of three as the single source of truth.
- Resolve a closed session as follows:
  - at least three `APPROVE` votes: `APPROVED`;
  - at least three `REJECT` votes: `REJECTED`;
  - all five members voted and approve/reject counts are equal: close the round and open a fresh Board re-vote;
  - a split before all eligible voters have voted remains pending; after quorum and a strict majority, the Chair may close early.

## Constraints

- Abstentions count as participation but never support approval or rejection.
- Do not add scheduling, automatic close, or a new workflow state.
- The frontend must use the session quorum, not a separate hard-coded quorum.

## Verification

- A voting-session form has no time inputs.
- Three approvals and three rejections produce the matching final result.
- `2 APPROVE`, `1 REJECT` is an approved majority once the session quorum is three submitted votes.
- An equal `2 APPROVE`, `2 REJECT` result closes the full four-seat round and opens a fresh Board re-vote.
