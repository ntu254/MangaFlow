# Product Requirements

## Functional requirements

These requirements cover internal manga production and publishing operations
only. Public catalog browsing, personal libraries, chapter reading, and reading
progress are not MVP requirements.

### Auth

- Custom auth, no Clerk.
- Admin creates users.
- Role-based redirect after login.
- JWT access token and refresh token.

### Series proposal

- Mangaka creates Series Profile.
- Mangaka uploads initial Manuscript.
- Tantou Editor reviews before Board.
- Board approves before production.

### Production

- Mangaka creates Chapter only after Series approval.
- Mangaka uploads Pages.
- System stores original files and generates variants.
- Mangaka/Editor creates Regions.
- Mangaka/Editor assigns Tasks to Assistant.

### Assistant workflow

- Assistant must be in Production Team before assignment.
- Assistant sees only assigned Task Workspace.
- Task may include read-only context pages.
- Assistant submits file/text result.
- Production Team membership is assignment eligibility only; actual access is
  granted by `Task.assignedTo`.

### Review

- Mangaka approves internally.
- Tantou Editor final approves.
- Comments must be resolved by Editor before publish.

### Publication

- Chapter readiness checklist must pass.
- Editor manages concrete publication schedule.
- Publication readiness is backend-owned and should be evaluated by
  `PublicationReadinessService`.

### Ranking

- Board imports voteCount and readerScore.
- System calculates finalScore.

### Payroll

- Payroll is tracking only.
- Earnings are calculated after Editor final approval.
- MVP formula is `finalPayment = baseRate * deadlineMultiplier`.
- Revision fee is future scope.

## Non-functional requirements

- Private file storage with signed URLs.
- Backend-enforced permissions.
- Audit for critical actions.
- Clean pastel UI system.
- Deployable on Vercel/Railway.
