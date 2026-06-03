# Test Matrix

This file maps product behavior to proof.

Do not mark a row implemented until tests or validation evidence exist.

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
| US-000 | Foundation scaffold: product docs, npm workspace client/server, backend health smoke, AI service placeholder | no | no | no | yes | implemented | `docs/stories/epics/E00-phase-0-foundation/US-000-foundation-scaffold.md` |
| MF-001 | Auth/User Sync: Google OAuth identity boundary, internal user sync, current-user API, onboarding redirect state | yes | yes | no | yes | implemented | `docs/stories/epics/E01-auth-user-sync/MF-001-auth-user-sync/validation.md` |
| MF-002 | Role Assignment: admin reviews requested roles and assigns/suspends/reactivates users safely | yes | yes | no | yes | implemented | `docs/stories/epics/E02-role-assignment/MF-002-role-assignment/validation.md` |
| MF-024 | Mobile MVP: Expo React Native companion app for Tantou Editor and Editorial Board review, voting, ranking, readiness, and notifications | yes | no | no | yes | implemented | `docs/stories/epics/E03-mobile-mvp/MF-003-mobile-editor-board-mvp/validation.md` |
| MF-003 | Admin Role Review UI: admin can review pending users and trigger role/status actions from the browser | yes | yes | no | yes | implemented | `docs/stories/epics/E02-role-assignment/MF-003-admin-role-review-ui/validation.md` |
| MF-004 | Series Management: Mangakas can create/list/update/delete draft Series with owner SeriesMember access enforced | yes | yes | no | yes | implemented | `docs/stories/epics/E04-series-management/MF-004-series-management.md` |
| MF-005 | Role & Permission System: backend RBAC middlewares and frontend RoleGuard enforce allowed system/series roles | yes | yes | no | yes | implemented | `docs/stories/epics/E03-role-and-permission-system/validation.md` |
| MF-006 | Manuscript Management CRUD: Mangakas upload/submit manuscripts and Editors review them with series-scope RBAC enforced | yes | yes | no | yes | implemented | `docs/stories/epics/E05-manuscript-management/MF-006-manuscript-crud.md` |
| MF-007 | Chapter & Page Management CRUD: Mangakas manage chapters/pages with series-scope RBAC, page file upload, status validation, and deletion proof | yes | yes | no | yes | implemented | `docs/stories/epics/E06-chapter-page-management/MF-007-chapter-page-management.md` |
| MF-008 | File Upload & Cloudflare R2: multipart uploads store originals/variants, create FileAsset metadata, and fall back to local filesystem storage when S3 is unavailable | yes | yes | no | yes | implemented | `docs/stories/epics/E07-file-upload-cloudflare-r2/MF-008-file-upload-cloudflare-r2/validation.md` |
| MF-009 | Region Management API: page-scoped rectangular Regions can be created/listed/fetched/updated/deleted with normalized coordinates and series RBAC | yes | yes | no | yes | implemented | `docs/stories/epics/E08-annotation-region/MF-009-region-management-api/validation.md` |
| MF-010 | Page Workspace Region UI: page cards open a workspace that displays, creates, and deletes normalized rectangular Regions | yes | yes | no | yes | implemented | `docs/stories/epics/E08-annotation-region/MF-010-page-workspace-region-ui.md` |
| MF-011 | Annotation Management API: page-scoped rectangular Annotations can be created/listed/fetched/updated/deleted with series RBAC and creator/editor/admin mutation rules | yes | yes | no | yes | implemented | `docs/stories/epics/E08-annotation-region/MF-011-annotation-management-api/validation.md` |
| MF-012 | Page Workspace Annotation UI: workspace loads, creates, resolves/reopens, and deletes page Annotations against the MF-011 API | yes | yes | no | yes | implemented | `docs/stories/epics/E08-annotation-region/MF-012-page-workspace-annotation-ui.md` |
| MF-013 | Task Assignment API Foundation: Mangaka/Editor/Admin can create page/region Tasks, assigned Assistants can list/detail/start TODO Tasks | yes | yes | no | yes | implemented | `docs/stories/epics/E09-task-assignment/MF-013-task-assignment-api-foundation/validation.md` |
| MF-014 | Task Assignment UI: Mangaka can create region Tasks in Page Workspace, and Assistants can view/start assigned Tasks from dashboard | yes | yes | no | yes | implemented | `docs/stories/epics/E09-task-assignment/MF-014-task-assignment-ui/validation.md` |
| MF-015 | Assistant Submission API Foundation: assigned Assistants can create immutable versioned Submissions and authorized users can list/detail them | yes | yes | no | yes | implemented | `docs/stories/epics/E10-assistant-submission/MF-015-assistant-submission-api-foundation/validation.md` |
| MF-016 | Assistant Submission UI: Assistants can view assigned task detail with page/region preview and submit result URLs | yes | yes | no | yes | implemented | `docs/stories/epics/E10-assistant-submission/MF-016-assistant-submission-ui/validation.md` |
| MF-017 | Review & Comment API Foundation: Comment model, basic CRUD endpoints, and transition endpoints (/mark-fixed, /verify-fixed, /resolve, /reopen) with series RBAC enforced | yes | yes | no | yes | implemented | `docs/stories/epics/E11-review-comment/MF-017-review-comment-api-foundation/validation.md` |
| MF-018 | Page Workspace Comment Panel UI: Comment panel in right sidebar displays comments and action logs, allows comments to be submitted, and handles role-based transitions | yes | yes | no | yes | implemented | `docs/stories/epics/E11-review-comment/MF-018-page-workspace-comment-panel-ui/validation.md` |
| MF-019 | Editor Approval API Foundation: endpoints for manuscript, chapter, page approval and revision requests, validation blocking approval with unresolved comments | yes | yes | no | yes | implemented | `docs/stories/epics/E12-editor-approval-workflow/MF-019-editor-approval-api-foundation/validation.md` |
| MF-020 | Editor Approval Workflow UI: Editor Dashboard, dynamic chapter page review, page workspace approval/revision request panels | yes | yes | no | yes | implemented | `docs/stories/epics/E12-editor-approval-workflow/MF-020-editor-approval-ui/validation.md` |
| MF-021 | Board Voting API Foundation: BoardMember, BoardVote, BoardDecision models, voting, finalize, and tie-break endpoints | yes | yes | no | yes | implemented | `docs/stories/epics/E13-board-voting/MF-021-board-voting-api-foundation/validation.md` |
| MF-022 | Board Voting Workflow UI: series-approvals, detailed review screen, vote actions, and tie-break control components | yes | yes | no | yes | implemented | `docs/stories/epics/E13-board-voting/MF-022-board-voting-ui/validation.md` |
| MF-023 | Ranking API Foundation: Ranking model, importing reader/vote scores, calculation formula, warning/at-risk status endpoints | yes | yes | no | yes | implemented | `docs/stories/epics/E14-ranking/MF-023-ranking-api-foundation/validation.md` |
| MF-024 | Ranking UI: Board ranking table, import reader/vote scores form, Mangaka ranking dashboard with status warnings | yes | yes | no | yes | implemented | `docs/stories/epics/E14-ranking/MF-024-ranking-ui/validation.md` |
| MF-025 | UI Quality & Tech Debt Cleanup: fixed env var, stale closures, resolved any types, extracted shared API utilities, and standard error responses | yes | yes | no | yes | implemented | |
| MF-026 | Payroll API Foundation: configured TaskRates (Admin), calculated/confirmed AssistantEarnings (Mangaka/Admin) and paid transitions (Admin) | yes | yes | no | yes | implemented | `docs/stories/epics/E15-payroll/MF-026-payroll-api-foundation/validation.md` |
| MF-027 | AI Bubble Integration (EPIC-16) | yes | yes | no | no | implemented | `docs/stories/epics/E16-ai-bubble-integration/MF-027-ai-bubble-integration/overview.md` |
| MF-028 | Sidebar Layout Wiring: Enable AppShell + RoleSidebar + AppHeader for all 5 role layouts | yes | yes | no | no | implemented | `docs/stories/epics/E17-sidebar-layout-wiring/MF-028-sidebar-layout-wiring/overview.md` |
| MF-029 | Missing UI Pages: Build TaskList, Submissions, and AssignedSeries pages for Assistant/Mangaka/Editor roles | yes | yes | no | no | implemented | `docs/stories/epics/E18-missing-ui-pages/MF-029-missing-ui-pages/overview.md` |
| US-019 | Multi-Agent Task Loop: agents follow Harness docs first, coordinate sub-agents/plugins/skills, validate proof, and record durable state | no | yes | no | yes | implemented | `docs/stories/US-019-multi-agent-task-loop.md` |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.
