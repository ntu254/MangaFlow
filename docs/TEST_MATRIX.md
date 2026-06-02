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
| MF-001 | Auth/User Sync: Clerk identity boundary, internal user sync, current-user API, onboarding redirect state | yes | yes | no | yes | implemented | `docs/stories/epics/E01-auth-user-sync/MF-001-auth-user-sync/validation.md` |
| MF-002 | Role Assignment: admin reviews requested roles and assigns/suspends/reactivates users safely | yes | yes | no | yes | implemented | `docs/stories/epics/E02-role-assignment/MF-002-role-assignment/validation.md` |
| MF-003 | Admin Role Review UI: admin can review pending users and trigger role/status actions from the browser | yes | yes | no | yes | implemented | `docs/stories/epics/E02-role-assignment/MF-003-admin-role-review-ui/validation.md` |
| MF-004 | Series Management: Mangakas can create/list/update/delete draft Series with owner SeriesMember access enforced | yes | yes | no | yes | implemented | `docs/stories/epics/E04-series-management/MF-004-series-management.md` |
| MF-005 | Role & Permission System: backend RBAC middlewares and frontend RoleGuard enforce allowed system/series roles | yes | yes | no | yes | implemented | `docs/stories/epics/E03-role-and-permission-system/validation.md` |
| MF-006 | Manuscript Management CRUD: Mangakas upload/submit manuscripts and Editors review them with series-scope RBAC enforced | yes | yes | no | yes | implemented | `docs/stories/epics/E05-manuscript-management/MF-006-manuscript-crud.md` |
| MF-007 | Chapter & Page Management CRUD: Mangakas manage chapters/pages with series-scope RBAC, page file upload, status validation, and deletion proof | yes | yes | no | yes | implemented | `docs/stories/epics/E06-chapter-page-management/MF-007-chapter-page-management.md` |
| MF-008 | File Upload & Cloudflare R2: multipart uploads store originals/variants, create FileAsset metadata, and fall back to local filesystem storage when S3 is unavailable | yes | yes | no | yes | implemented | `docs/stories/epics/E07-file-upload-cloudflare-r2/MF-008-file-upload-cloudflare-r2/validation.md` |
| MF-009 | Region Management API: page-scoped rectangular Regions can be created/listed/fetched/updated/deleted with normalized coordinates and series RBAC | yes | yes | no | yes | implemented | `docs/stories/epics/E08-annotation-region/MF-009-region-management-api/validation.md` |
| MF-010 | Page Workspace Region UI: page cards open a workspace that displays, creates, and deletes normalized rectangular Regions | yes | yes | no | yes | implemented | `docs/stories/epics/E08-annotation-region/MF-010-page-workspace-region-ui.md` |
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
