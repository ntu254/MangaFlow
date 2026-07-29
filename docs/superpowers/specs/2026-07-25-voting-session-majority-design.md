# Voting session 3/5 design

## Goal

Make Board voting immediate and deterministic: no schedule selection, and a decision requires three votes for the same outcome from the five eligible Board members.

## Scope

- Remove `scheduledFor` and `closesAt` controls from the voting-session form. A session opens immediately and the Board Chair closes it manually.
- Keep the existing five eligible Board members and quorum of three as the single source of truth.
- Resolve a closed session as follows:
  - at least three `APPROVE` votes: `APPROVED`;
  - at least three `REJECT` votes: `REJECTED`;
  - all five members voted and approve/reject counts are equal: `TIE_BREAK_REQUIRED` for the Editor-in-chief;
  - every other outcome, including `2 APPROVE`, `1 REJECT`, `2 ABSTAIN`: `NO_QUORUM`, then return the proposal to `PENDING_BOARD` for a new session.

## Constraints

- Abstentions count as participation but never support approval or rejection.
- Do not add scheduling, automatic close, or a new workflow state.
- The frontend must use the session quorum, not a separate hard-coded quorum.

## Verification

- A voting-session form has no time inputs.
- Three approvals and three rejections produce the matching final result.
- `2 APPROVE`, `1 REJECT`, `2 ABSTAIN` produces `NO_QUORUM` and returns the proposal to `PENDING_BOARD`.
- A `2 APPROVE`, `2 REJECT`, `1 ABSTAIN` result requires an Editor-in-chief tie-break.
