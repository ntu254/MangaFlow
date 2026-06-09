# Test Matrix

This file maps product behavior to proof.

No product behavior has been defined or implemented yet. Do not mark a row
implemented until tests or validation evidence exist.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| Story | Contract | Unit | Integration | E2E | Platform | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MF-HIOS-073 | task-assignment.md, page-workspace.md, main.md | yes | no | no | yes | implemented | Task/task-type controller split into dedicated modules; server/client lint/build, 66 server tests, docs verifiers passed. |
| MF-HIOS-072 | ui-main.md, main.md | no | no | no | yes | implemented | App route tree extracted into dedicated modules; client lint/build and docs verifiers passed. |
| MF-HIOS-071 | submission-review.md, task-assignment.md, comment-resolution.md | yes | no | no | yes | implemented | Submission service split into access policy, transition guard, query/create and review command modules; server/client lint/build, 66 server tests, docs verifiers passed. |
| MF-HIOS-070 | comment-resolution.md, submission-review.md, page-workspace.md | yes | no | no | yes | implemented | Comment service split into access policy, transition guard, scope service, command/query modules; server/client lint/build, 66 server tests, docs verifiers passed. |
| MF-HIOS-069 | task-assignment.md, page-workspace.md, main.md | yes | no | no | yes | implemented | Task persistence, assignment policy, scope guard, and mapper split; server/client lint/build, 66 server tests, docs verifiers passed. |
| MF-HIOS-068 | chapter-production.md, page-workspace.md | yes | no | no | yes | implemented | Chapter service modularized; server/client lint/build and server tests passed. |
| MF-HIOS-067 | ui-series-chapter.md | no | no | no | yes | implemented | SeriesDetailPage componentized; client lint/build passed. |
| MF-HIOS-066 | ui-board.md | no | no | no | yes | implemented | BoardPage componentized; client lint/build passed. |
| MF-HIOS-065 | ui-workspace.md | no | no | no | yes | implemented | WorkspacePage componentized; client lint/build passed. |
| MF-HIOS-064 | ui-series-chapter.md | no | no | no | yes | implemented | ChapterDetailPage componentized; client lint/build passed. |
| MF-HIOS-063 | ui-task.md | no | no | no | yes | implemented | TasksPage componentized; client lint/build passed. |
| MF-HIOS-062 | ui-admin.md | yes | no | no | yes | implemented | Client/server lint/build passed; dashboard unit test passed. |
| MF-HIOS-061 | main.md, auth.md, page-workspace.md, ai-bubble-translation.md | yes | no | no | yes | implemented | Server env/accessPolicy tests plus server/client lint/build passed. |
| MF-HIOS-060 | ui-review.md | no | no | no | yes | implemented | Client lint/build passed after review page extraction. |
| TBD | Add rows when story packets are created | no | no | no | no | planned | none |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.














