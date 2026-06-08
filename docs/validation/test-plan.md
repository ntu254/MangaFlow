# Test Plan

## Unit tests

- Auth token creation
- Password hashing
- Ranking formula
- Payroll formula
- Publication readiness checker
- Board majority calculation
- Task assignment validation
- Workflow status transition guards for each entity in
  `docs/contracts/workflow-status.md`
- Board three-option plurality, minimum vote, deadline, and tie-break rules
- PublicationReadinessService item-level pass/fail reasons
- Payroll MVP formula: `finalPayment = baseRate * deadlineMultiplier`

## Integration tests

- Auth login/me
- Admin create user
- Series submit
- Editor review
- Board approve
- Chapter gate
- Page upload
- Region create
- Task assignment
- Assistant workspace permission
- Submission review chain
- Comment resolution
- Ranking import
- Payroll calculation
- Editor proposal review is separate from Editor production final approval
- Board Chair votes normally and only tie-breaks when required
- Action endpoints use POST for workflow decisions
- Assistant access is granted by `Task.assignedTo`, not SeriesMember alone

## Security tests

- Assistant cannot access page workspace directly
- Suspended user cannot login
- Wrong role cannot finalize Board decision
- Unapproved series cannot create chapter
- Private file requires signed URL
- Assistant cannot access another assistant's task workspace
- Assistant cannot view pages outside assigned task and explicit
  `contextPageIds`
- Assistant cannot view full chapter by SeriesMember membership alone
- Assistant cannot view Board data
- Assistant cannot confirm payroll
- Assistant cannot create tasks
- Frontend-only permission checks do not satisfy backend access tests
