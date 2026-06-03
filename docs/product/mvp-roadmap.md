# MVP Roadmap

## MVP Epics

| Epic | Name | Priority |
| --- | --- | --- |
| EPIC-01 | Project Setup | Must Have |
| EPIC-02 | Authentication and User Sync | Must Have |
| EPIC-03 | Role and Permission System | Must Have |
| EPIC-04 | Series Management | Must Have |
| EPIC-05 | Manuscript Management | Must Have |
| EPIC-06 | Chapter and Page Management | Must Have |
| EPIC-07 | File Upload and Cloudflare R2 | Must Have |
| EPIC-08 | Annotation and Region | Must Have |
| EPIC-09 | Task Assignment | Must Have |
| EPIC-10 | Assistant Submission | Must Have |
| EPIC-11 | Review and Comment Workflow | Must Have |
| EPIC-12 | Editor Approval Workflow | Must Have |
| EPIC-13 | Board Voting | Must Have |
| EPIC-14 | Ranking | Must Have |
| EPIC-15 | Payroll Tracking | Must Have |
| EPIC-16 | AI Bubble Integration | Should Have |
| EPIC-17 | Notification | Should Have |
| EPIC-18 | Dashboard | Should Have |
| EPIC-19 | Deployment | Must Have |
| EPIC-20 | Seed Data and Demo Flow | Must Have |

## Harness-Aligned Delivery Phases

### Phase 0 - Foundation

Create product docs, first story packet, test matrix row, and minimal app
surface scaffolding. Prove only build and health smoke behavior.

### Phase 1 - Auth and Roles

Wire Google OAuth + JWT, internal user sync, onboarding, system roles, series
memberships, and route/API guards.

### Phase 2 - Core Manga Data

Implement series, manuscript, chapter, page, file metadata, and storage upload
contracts.

### Phase 3 - Production Workflow

Implement regions, annotations, task assignment, assistant submission, review,
comments, and editor approval.

### Phase 4 - Governance

Implement board voting, board decisions, ranking import/calculation, at-risk
series handling, and publication support.

### Phase 5 - Payroll and AI

Implement task rates, assistant earnings, payroll calculations, AI bubble
processing, and AI result mapping.

### Phase 6 - Polish and Deploy

Implement notifications, dashboards, seed/demo flows, deployment proof, and
release readiness checks.

## First Story

The first story packet is
`docs/stories/epics/E00-phase-0-foundation/US-000-foundation-scaffold.md`.
