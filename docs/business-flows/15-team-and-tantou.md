# Team and Tantou Rules

## Roles

The only roles are `ADMIN`, `MANGAKA`, `ASSISTANT`, `EDITOR`, and `BOARD`.
`Chair` is a Board designation used to control `VotingSession`; it is not a
separate role. Tantou is an ordinary `EDITOR` assigned to a Series.

## Tantou assignment

- A Series has at most one active Tantou Editor.
- Only the Series' owning Mangaka (`Series.authorId`) can assign or remove it.
- The target must be an active user with role `EDITOR`.
- An Editor may be Tantou for multiple Series.
- Removing or replacing a Tantou is rejected while any Chapter review,
  blocking Comment, Material review, or Submission review remains open.
- Workload must be completed or reassigned before removal; only then may a new
  Tantou be assigned.
- Chapter review, blocking-comment resolve/reopen, scheduling, and publication
  require the current active Tantou membership.

## Assistant team membership

`POST /api/series/:seriesId/invites` creates a `PENDING` invite only. It never
creates an active membership. The invited Assistant can list their own invites
with `GET /api/series/invites`, then accept or decline with:

- `POST /api/series/invites/:inviteId/accept`
- `POST /api/series/invites/:inviteId/decline`

Only an accepted invite creates an active `SeriesMember`. Direct
`POST /api/series/:seriesId/members` is retired with
`410 INVITE_ACCEPTANCE_REQUIRED`. Pending or declined invites do not grant
Series access or task creation rights.

## Claim and archive rules

- An Editor can claim an unclaimed proposal.
- The claiming Editor alone can release their own claim.
- Another Editor may claim after the previous claim is released.
- There is no special claim reassignment action.
- Proposal archive is restricted to the owning Mangaka and requires a reason.
- A Board tie closes as history and opens a fresh Board re-vote; no weighted
  editor tie-break exists.
