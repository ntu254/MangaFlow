# Test Plan

## Unit tests

- Auth token creation
- Password hashing
- Ranking formula
- Payroll formula
- Publication readiness checker
- Board majority calculation
- Task assignment validation

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

## Security tests

- Assistant cannot access page workspace directly
- Suspended user cannot login
- Wrong role cannot finalize Board decision
- Unapproved series cannot create chapter
- Private file requires signed URL
