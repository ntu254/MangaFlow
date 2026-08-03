# Assistant, Editor, and Board workflow fixes — TDD evidence

Source plan: journeys were derived from the reported Canvas, approval, editorial checklist,
Board voting, publication, and expiring-resource defects.

## User journeys

- As a Mangaka, I cannot assign assistant work to a page without a usable source asset.
- As an Editor, I must claim a proposal before changing its checklist or making a decision.
- As an Editor, I can send a proposal to the Board only after all six review criteria pass.
- As a Mangaka, I can approve the current Assistant submission without duplicate earnings.
- As a Board member, Decision Focus opens the canonical proposal decision workspace.
- As an Editor, I cannot publish a chapter before its scheduled time.
- As a reviewer, stored files resolve from their durable `fileKey`, not an expired signed URL.
- As an Assistant, I cannot submit another file while the current submission is waiting for review.
- As an Editor, I can inspect chapter files, notes, and publication timing from Publications.
- As an Assistant, I can inspect the calculation and source of each earning.
- As a role user, I can open a notification and inspect its full content and workflow action.

## RED / GREEN report

| Guarantee                                                    | Test or validation                                       | RED evidence                                           | GREEN evidence                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Unclaimed proposal decisions are rejected                    | `validation-guardrails.test.ts`                          | `FORWARD` returned 200                                 | 409 `REVIEW_CLAIM_REQUIRED`                                                                |
| Board forwarding requires a persisted 6/6 checklist          | `validation-guardrails.test.ts`                          | Incomplete `FORWARD` returned 200                      | 409 until checklist save, then 200                                                         |
| Task assignment requires a real page source                  | `validation-guardrails.test.ts`                          | Task was created with status 201                       | 409 `PAGE_SOURCE_REQUIRED`                                                                 |
| Assistant approval remains idempotent                        | `workflow.test.ts` targeted approval test                | Existing regression target                             | PASS; one earning retained                                                                 |
| Publication lifecycle remains canonical                      | `p0-workflow-refactor.test.ts` targeted publication test | Existing regression target                             | PASS                                                                                       |
| Frontend contracts compile                                   | `npm run typecheck`                                      | One checklist shape type error found                   | PASS after explicit checklist shape                                                        |
| Frontend and backend production builds                       | `npm run build`; `npm --prefix backend run build`        | No build RED                                           | Both PASS                                                                                  |
| UI behavior and console                                      | Local Playwright QA                                      | Prior Canvas emitted `ERR_UNKNOWN_URL_SCHEME`          | No console issues; canonical Board redirect verified                                       |
| Submitted tasks do not offer duplicate submission            | `business-flow-contracts.spec.ts`                        | Compile RED: `submission-state` module did not exist   | `SUBMITTED` and stale `IN_PROGRESS` + active submission both resolve to `canSubmit: false` |
| Marking one notification read preserves other unread items   | `business-flow-contracts.spec.ts`                        | Compile RED: `notification-cache` module did not exist | Only the selected notification ID receives `readAt`                                        |
| Marking one notification read preserves the rest of the inbox | `business-flow-contracts.spec.ts`                      | Missing read-cache contract                           | Only the selected notification ID receives `readAt`                                       |
| Notification workflow links reject executable schemes        | `business-flow-contracts.spec.ts`                        | New contract had no URL guard                          | Internal paths and HTTP(S) pass; `javascript:` and `data:` are rejected                    |
| Chapter, earning, and notification details render accessibly | Local Playwright QA                                      | Detail UI did not exist                                | All drawers expose a titled dialog; chapter drawer has no 375px overflow                   |

## Commands and results

- `npm test -- --run src/__tests__/validation-guardrails.test.ts`: 36/36 passed.
- `npm test -- --run src/__tests__/p0-workflow-refactor.test.ts -t "writes canonical proposal review statuses|uses canonical publication schedule"`: 2/2 passed.
- `npm test -- --run src/__tests__/workflow.test.ts -t "Mangaka approves|keeps one earning"`: targeted approval test passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm --prefix backend run build`: passed.
- `npm run audit:architecture`: passed.
- Root and backend `npm audit --audit-level=high`: 0 vulnerabilities.
- `npx playwright test --config=playwright.contract.config.ts`: 13/13 passed.
- `npm test -- --run src/__tests__/validation-guardrails.test.ts src/__tests__/p0-workflow-refactor.test.ts`: 73/73 passed.
- ESLint on the changed frontend/test files: passed with no warnings after moving shared
  state/cache logic to entity and shared layers.
- Browser QA: submitted task shows disabled `Awaiting Review` and zero `Submit Work` controls;
  Publications, Earnings, Assistant Notifications, Editor Notifications, and Board Notifications
  detail drawers opened successfully with no current-route console or network failures.

## Known verification gaps

- The repository-wide ESLint command includes vendored `.claude/skills` files and currently fails
  on their pre-existing formatting errors. ESLint on the changed frontend source files passes.
- Backend `npm run lint` has a pre-existing implicit-`any` error in
  `backend/src/__tests__/workflow-support.test.ts`; the production backend build passes.
- No coverage script is defined for the frontend package, so no aggregate coverage percentage was
  generated.
- The reported live ID `task-22e7d225` is no longer present in the current local database
  (`TASK_NOT_FOUND`), so its submitted state was reproduced with a deterministic intercepted API
  fixture in browser QA and covered by the reusable state contract.
