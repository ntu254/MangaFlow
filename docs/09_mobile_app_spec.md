**MangaFlow Mobile App Specification**

**Tantou Editor & Editorial Board**

Version 1.0 \| Fresh Pastel Creative Theme \| Mobile Companion App

|     |     |     |     |     |     |
|-----|-----|-----|-----|-----|-----|

| **Document Item** | **Description**                                                                                                         |
|-------------------|-------------------------------------------------------------------------------------------------------------------------|
| Product           | Manga Creation Workflow and Publishing Management System - MangaFlow                                                    |
| Scope             | Mobile app screens and requirements for Tantou Editor and Editorial Board                                               |
| Main goal         | Allow quick review, decision-making, approval tracking, ranking monitoring, and notification handling on mobile devices |
| Mobile role       | Companion app, not full replacement for desktop web workspace                                                           |
| Design direction  | Fresh Pastel Creative theme using \#9065d5, \#e560bc, \#ff7196, \#ff9971, \#ffc95e, \#f9f871                            |

# Table of Contents

- 1\. Mobile Product Scope

- 2\. Mobile UX Principles

- 3\. Mobile Tech Stack Recommendation

- 4\. Shared Mobile Design System

- 5\. Tantou Editor Mobile App

- 6\. Editorial Board Mobile App

- 7\. Mobile Navigation Map

- 8\. Screen Specifications

- 9\. Notification Specification

- 10\. API Mapping

- 11\. Security and Permission Rules

- 12\. MVP Priority and Acceptance Criteria

# 1. Mobile Product Scope

The MangaFlow mobile app is designed as a companion application for fast
review, approval, voting, notification, and monitoring workflows. It
does not replace the full desktop web app for heavy production work such
as batch upload, advanced canvas operations, complex annotation, file
management, or AI batch processing.

| **Area**           | **Mobile Scope**                                                                                                               |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Tantou Editor      | Review series, manuscript summary, page status, comments, publication readiness, ranking support, and urgent approval actions. |
| Editorial Board    | Review series summary, vote, chair tie-break, ranking, at-risk decision, publication decision, and notification handling.      |
| Not in mobile MVP  | Full page production workspace, batch page upload, PSD upload, layer management, full annotation editing, AI batch processing. |
| Best device target | Smartphone for quick actions; tablet may support larger review preview.                                                        |

| **Mobile MVP Rule** | **Decision**                                                                                   |
|---------------------|------------------------------------------------------------------------------------------------|
| Editor mobile app   | Focused on review queue, comment workflow, publication readiness, and quick approval.          |
| Board mobile app    | Focused on summary-based decision, voting, ranking, and at-risk series.                        |
| Board page access   | Board does not view detailed manga pages in MVP; only summary and analytics.                   |
| Editor page access  | Editor can view page preview and comments, but detailed canvas operation is better on desktop. |

# 2. Mobile UX Principles

- Quick decision first: mobile screens must surface pending actions
  immediately.

- Summary before detail: use cards, badges, and progress indicators to
  reduce scrolling.

- Role-based simplicity: each role sees only relevant actions and
  navigation items.

- Safe approval: destructive or final decisions require confirmation
  dialogs.

- Pastel creative UI: bright, friendly, clean, and suitable for
  manga/art production.

- No hidden permission: actions that the user cannot perform should not
  be shown.

# 3. Mobile Tech Stack Recommendation

| **Layer**         | **Recommendation**                   | **Reason**                                                                |
|-------------------|--------------------------------------|---------------------------------------------------------------------------|
| Mobile Framework  | React Native + Expo + TypeScript     | Good for fast MVP, shared React knowledge, easier deployment and testing. |
| Authentication    | JWT + Google OAuth                   | Consistent with web authentication strategy.                              |
| Data Fetching     | TanStack Query                       | Caching, mutation handling, loading states, optimistic updates.           |
| Styling           | NativeWind or themed component layer | Can reuse Tailwind-like design tokens.                                    |
| Backend           | Same Express API on Railway          | No separate mobile backend required for MVP.                              |
| Storage Access    | Private signed URLs from backend     | Protect unpublished manuscripts and page previews.                        |
| Push Notification | Expo Notifications or FCM/APNs later | Can start with in-app notifications in MVP.                               |

# 4. Shared Mobile Design System

| **Token**      | **Color** | **Usage**                               |
|----------------|-----------|-----------------------------------------|
| Primary Purple | \#9065d5  | Primary CTA, active tab, main highlight |
| Pink Purple    | \#e560bc  | Creative accent, notification highlight |
| Rose Pink      | \#ff7196  | Revision, rejection, urgent warnings    |
| Coral          | \#ff9971  | Secondary CTA, deadline, activity       |
| Soft Yellow    | \#ffc95e  | Ranking, warning, attention             |
| Pastel Lime    | \#f9f871  | Success, approved, positive signal      |
| Background     | \#fff9fb  | Main app background                     |
| Card           | \#ffffff  | Card and list item background           |
| Panel          | \#fff7ec  | Soft info panel background              |
| Text Primary   | \#2f243a  | Readable dark text on pastel background |

| **Component**   | **Mobile Style Rule**                                                     |
|-----------------|---------------------------------------------------------------------------|
| Cards           | White background, 18-24px radius, soft pastel shadow, subtle border.      |
| Bottom Tab      | Pastel background, purple active icon/text, rounded top corners optional. |
| Header          | Compact title, optional gradient accent, notification icon.               |
| Badges          | Always show text and color, never rely on color only.                     |
| Buttons         | Large touch target, minimum 44px height.                                  |
| Decision Dialog | Clear summary, risk warning, confirm button with role-specific wording.   |

# 5. Tantou Editor Mobile App

The Tantou Editor mobile app supports editorial monitoring, quick
review, comment resolution, publication readiness checks, and ranking
support. It is optimized for quick decision-making and urgent feedback
while the full desktop app remains the primary workspace for heavy
annotation and production management.

| **Editor Capability**       | **MVP Mobile Support**                    |
|-----------------------------|-------------------------------------------|
| Assigned series overview    | Yes                                       |
| Manuscript review summary   | Yes                                       |
| Page preview review         | Yes                                       |
| Add quick comment           | Yes                                       |
| Resolve/reopen comments     | Yes                                       |
| Create task                 | Limited quick task creation               |
| Full canvas annotation      | Tablet/desktop recommended, phone limited |
| Publication readiness check | Yes                                       |
| Ranking support data        | Yes                                       |

| **Editor Bottom Tab** | **Purpose**                          |
|-----------------------|--------------------------------------|
| Home                  | Dashboard and urgent review queue    |
| Series                | Assigned series list                 |
| Reviews               | Manuscript/page/comment review queue |
| Publication           | Publication readiness and deadlines  |
| Notifications         | Editor alerts and activity           |

## 5.1 Editor Screen List

| **Screen**            | **Route Name**                   | **Primary Purpose**                                                      |
|-----------------------|----------------------------------|--------------------------------------------------------------------------|
| Editor Home           | EditorHomeScreen                 | Show urgent workload, assigned series, pending comments, deadline risks. |
| Assigned Series       | EditorSeriesListScreen           | View series assigned to the editor.                                      |
| Series Detail         | EditorSeriesDetailScreen         | View progress, manuscript, chapters, ranking support, and comments.      |
| Manuscript Review     | EditorManuscriptReviewScreen     | Review manuscript summary, files, and decision actions.                  |
| Page Review           | EditorPageReviewScreen           | View page preview, task status, and comments.                            |
| Comment Queue         | EditorCommentQueueScreen         | Verify fixed comments, resolve, or reopen.                               |
| Publication Readiness | EditorPublicationReadinessScreen | Check if chapter is ready for publication.                               |
| Ranking Support       | EditorRankingSupportScreen       | View ranking data and prepare recommendation for Board.                  |

## 5.2 Editor Home Screen

| **Section**     | **Content**                                                               |
|-----------------|---------------------------------------------------------------------------|
| Header          | Greeting, role label Tantou Editor, notification bell.                    |
| Metric Cards    | Assigned Series, Manuscripts Waiting, Unresolved Comments, Deadline Risk. |
| Urgent Queue    | Items that require action within 24 hours.                                |
| Recent Activity | Mangaka updates, assistant submissions, board decisions.                  |
| Quick Actions   | Open Comment Queue, Open Publication Readiness, Open Ranking Support.     |

| **Primary Action** | **Behavior**                                |
|--------------------|---------------------------------------------|
| Open urgent review | Navigate to manuscript/page/comment detail. |
| Resolve comment    | Open comment action sheet.                  |
| Check readiness    | Open chapter publication checklist.         |

## 5.3 Assigned Series Screen

| **Item**        | **Specification**                                                              |
|-----------------|--------------------------------------------------------------------------------|
| Purpose         | List all series assigned to the Tantou Editor.                                 |
| Cards/List Item | Series title, Mangaka, status, current chapter, progress, ranking, risk badge. |
| Filters         | Status, deadline risk, ranking risk, publication type.                         |
| Action          | Tap series to open Series Detail.                                              |

## 5.4 Editor Series Detail Screen

| **Item**    | **Specification**                                                                         |
|-------------|-------------------------------------------------------------------------------------------|
| Purpose     | Mobile summary hub for one assigned series.                                               |
| Sections    | Overview, Current Chapter, Progress, Open Comments, Ranking Snapshot, Publication Status. |
| Actions     | Open Manuscript, Open Page Review, Open Comments, Open Ranking Support.                   |
| Restriction | No heavy file editing or batch upload on mobile.                                          |

## 5.5 Manuscript Review Screen

| **Item**     | **Specification**                                                              |
|--------------|--------------------------------------------------------------------------------|
| Purpose      | Allow Editor to review manuscript summary and give decision.                   |
| Content      | File list, preview thumbnail, version, Mangaka note, previous review comments. |
| Actions      | Approve, Request Revision, Forward to Board, Add Comment.                      |
| Confirmation | Forward to Board requires confirmation.                                        |

## 5.6 Page Review Screen

| **Item**     | **Specification**                                                                             |
|--------------|-----------------------------------------------------------------------------------------------|
| Purpose      | Review page status, preview, tasks, submissions and comments.                                 |
| Content      | Page preview, task progress, unresolved comments, latest submission.                          |
| Actions      | Add quick comment, Request Revision, Final Approve Page.                                      |
| Mobile Limit | Phone supports quick comments; precise rectangle annotation should be done on desktop/tablet. |

## 5.7 Comment Queue Screen

| **Item** | **Specification**                                                  |
|----------|--------------------------------------------------------------------|
| Purpose  | Resolve quality control comments before publication.               |
| States   | OPEN, FIXED_BY_ASSISTANT, VERIFIED_BY_MANGAKA, RESOLVED_BY_EDITOR. |
| Actions  | Resolve, Reopen, Open Page, Add Reopen Reason.                     |
| Rule     | Only Editor can resolve officially or reopen.                      |

## 5.8 Publication Readiness Screen

| **Item**  | **Specification**                                                                                           |
|-----------|-------------------------------------------------------------------------------------------------------------|
| Purpose   | Check if chapter can move toward publishing.                                                                |
| Checklist | All pages uploaded, all tasks approved, all comments resolved, Editor final approval, publication date set. |
| Actions   | Approve for Publication, Request Revision.                                                                  |
| Blocker   | If unresolved comments exist, approve action is disabled.                                                   |

## 5.9 Ranking Support Screen

| **Item** | **Specification**                                                                            |
|----------|----------------------------------------------------------------------------------------------|
| Purpose  | Prepare editorial recommendation for Board.                                                  |
| Content  | Current rank, previous rank, vote count, reader score, final score, trend, production notes. |
| Actions  | Add Recommendation, Share Summary to Board.                                                  |
| Output   | Editor recommendation attached to series summary.                                            |

# 6. Editorial Board Mobile App

The Editorial Board mobile app focuses on summary-based governance:
series approval, voting, ranking review, at-risk decisions, tie-break
handling for the Board Chair, and publication decision tracking. Board
users do not access detailed manga pages in MVP mobile.

| **Board Capability**               | **MVP Mobile Support** |
|------------------------------------|------------------------|
| Pending series approval            | Yes                    |
| Series summary review              | Yes                    |
| Vote approve/reject/needs revision | Yes                    |
| Tie-break by Board Chair           | Yes                    |
| Ranking table                      | Yes                    |
| Import ranking data                | Limited mobile form    |
| At-risk decision                   | Yes                    |
| Publication decision               | Yes                    |
| Detailed page viewing              | No in MVP              |

| **Board Bottom Tab** | **Purpose**                                   |
|----------------------|-----------------------------------------------|
| Home                 | Board dashboard and pending decision overview |
| Approvals            | Pending series approval queue                 |
| Ranking              | Ranking table and at-risk status              |
| Decisions            | Decision history and tie-break tasks          |
| Notifications        | Board alerts and vote reminders               |

## 6.1 Board Screen List

| **Screen**             | **Route Name**                  | **Primary Purpose**                                                       |
|------------------------|---------------------------------|---------------------------------------------------------------------------|
| Board Home             | BoardHomeScreen                 | Show pending approvals, votes required, at-risk series, recent decisions. |
| Approval Queue         | BoardApprovalQueueScreen        | List series waiting for board review.                                     |
| Series Approval Detail | BoardSeriesApprovalDetailScreen | View summary and vote.                                                    |
| Vote Screen            | BoardVoteScreen                 | Cast vote with reason.                                                    |
| Chair Tie-Break Screen | BoardTieBreakScreen             | Board Chair resolves vote tie.                                            |
| Ranking Table          | BoardRankingScreen              | View period ranking and final score.                                      |
| Ranking Import         | BoardRankingImportScreen        | Input vote count and reader score.                                        |
| At-Risk Series         | BoardAtRiskScreen               | Review series with warning/at-risk status.                                |
| Decision History       | BoardDecisionHistoryScreen      | View board decision history.                                              |

## 6.2 Board Home Screen

| **Item**     | **Specification**                                                                    |
|--------------|--------------------------------------------------------------------------------------|
| Purpose      | Give Board members a quick overview of decisions needed.                             |
| Metric Cards | Pending Approvals, Votes Required, At-Risk Series, Ranking Period, Recent Decisions. |
| Primary List | Approval queue sorted by urgency and submitted date.                                 |
| Chair Alert  | If user is BOARD_CHAIR, show tie-break tasks at top.                                 |

## 6.3 Approval Queue Screen

| **Item**     | **Specification**                                                            |
|--------------|------------------------------------------------------------------------------|
| Purpose      | List series waiting for Board approval.                                      |
| Card Content | Title, Mangaka, genre, submitted date, editor recommendation, vote progress. |
| Filters      | Genre, status, submitted date, vote progress.                                |
| Action       | Tap series to open approval detail.                                          |

## 6.4 Series Approval Detail Screen

| **Item**    | **Specification**                                                                              |
|-------------|------------------------------------------------------------------------------------------------|
| Purpose     | Show decision-ready summary for Board.                                                         |
| Content     | Series summary, Mangaka profile, genre, target audience, editor recommendation, vote progress. |
| Actions     | Approve, Reject, Needs Revision, Add Reason.                                                   |
| Restriction | No detailed page viewer in MVP.                                                                |

## 6.5 Vote Screen

| **Item**       | **Specification**                                             |
|----------------|---------------------------------------------------------------|
| Purpose        | Allow Board member to cast vote clearly.                      |
| Vote Options   | APPROVE, REJECT, NEEDS_REVISION.                              |
| Required Input | Reason is recommended, required for reject or needs revision. |
| Confirmation   | Submit vote confirmation dialog.                              |

## 6.6 Chair Tie-Break Screen

| **Item**   | **Specification**                                                       |
|------------|-------------------------------------------------------------------------|
| Purpose    | Allow Board Chair to resolve deadlock.                                  |
| Visible To | BOARD_CHAIR only.                                                       |
| Content    | Vote summary, editor recommendation, ranking context, decision options. |
| Actions    | Finalize Approved, Finalize Rejected, Finalize Needs Revision.          |

## 6.7 Ranking Screen

| **Item** | **Specification**                                                                             |
|----------|-----------------------------------------------------------------------------------------------|
| Purpose  | View ranking by period.                                                                       |
| Formula  | finalScore = voteCount \* 0.7 + normalizedReaderScore \* 0.3.                                 |
| Content  | Rank, previous rank, series, vote count, reader score, normalized score, final score, status. |
| Actions  | Mark Warning, Mark At Risk, Open Series Summary.                                              |

## 6.8 Ranking Import Screen

| **Item**      | **Specification**                                    |
|---------------|------------------------------------------------------|
| Purpose       | Input ranking data on mobile when needed.            |
| Fields        | Period, Series, Vote Count, Reader Score 1-10.       |
| System Output | Normalized reader score, final score preview.        |
| Validation    | Reader score must be 1-10; vote count must be \>= 0. |

## 6.9 At-Risk Series Screen

| **Item**     | **Specification**                                                           |
|--------------|-----------------------------------------------------------------------------|
| Purpose      | Support Board decisions for weak-performing series.                         |
| Content      | Current rank, trend, reader score, editor recommendation, decision history. |
| Actions      | Continue, Mark Warning, Cancel Series, Request Improvement Plan.            |
| Confirmation | Cancel Series requires strong confirmation.                                 |

# 7. Mobile Navigation Map

> Tantou Editor Mobile  
> ├── Home  
> ├── Series  
> │ ├── Assigned Series  
> │ └── Series Detail  
> ├── Reviews  
> │ ├── Manuscript Review  
> │ ├── Page Review  
> │ └── Comment Queue  
> ├── Publication  
> │ ├── Publication Readiness  
> │ └── Ranking Support  
> └── Notifications
>
> Editorial Board Mobile  
> ├── Home  
> ├── Approvals  
> │ ├── Approval Queue  
> │ ├── Series Approval Detail  
> │ └── Vote Screen  
> ├── Ranking  
> │ ├── Ranking Table  
> │ ├── Ranking Import  
> │ └── At-Risk Series  
> ├── Decisions  
> │ ├── Decision History  
> │ └── Chair Tie-Break  
> └── Notifications

# 8. Notification Specification

| **Notification Type** | **Tantou Editor**                                         | **Editorial Board**                         |
|-----------------------|-----------------------------------------------------------|---------------------------------------------|
| EDITOR_COMMENT        | Created when comment is assigned or replied.              | Not applicable.                             |
| REVISION_REQUESTED    | Editor receives update after Mangaka/Assistant action.    | Not applicable.                             |
| BOARD_DECISION        | Editor receives final decision for assigned series.       | Board receives finalized decision summary.  |
| RANKING_WARNING       | Editor sees warning for assigned series.                  | Board sees warning and at-risk queue.       |
| PUBLICATION_UPDATED   | Editor receives publication readiness or schedule update. | Board receives publication decision update. |
| VOTE_REQUIRED         | Not applicable.                                           | Board member receives vote reminder.        |
| TIE_BREAK_REQUIRED    | Not applicable.                                           | Only Board Chair receives tie-break alert.  |

| **Notification UI Rule** | **Specification**                                                     |
|--------------------------|-----------------------------------------------------------------------|
| Unread Badge             | Show badge on bottom tab and notification bell.                       |
| Deep Link                | Tap notification navigates to exact screen and target entity.         |
| Priority                 | Tie-break, at-risk, and publication blockers appear as high priority. |
| Mark Read                | Notification is marked read after open or manual action.              |

# 9. API Mapping

| **Mobile Screen**      | **Primary API Endpoints**                                                                               |
|------------------------|---------------------------------------------------------------------------------------------------------|
| Editor Home            | GET /api/dashboard/editor, GET /api/notifications/unread-count                                          |
| Assigned Series        | GET /api/series?scope=assigned-editor                                                                   |
| Manuscript Review      | GET /api/manuscripts/:id, POST /api/manuscripts/:id/approve, POST /api/manuscripts/:id/request-revision |
| Page Review            | GET /api/pages/:id, GET /api/comments/target/PAGE/:id, POST /api/pages/:id/editor-approve               |
| Comment Queue          | GET /api/comments?role=editor, POST /api/comments/:id/resolve, POST /api/comments/:id/reopen            |
| Publication Readiness  | GET /api/chapters/:id/readiness, POST /api/chapters/:id/approve                                         |
| Board Home             | GET /api/dashboard/board                                                                                |
| Approval Queue         | GET /api/series?status=BOARD_REVIEW                                                                     |
| Series Approval Detail | GET /api/series/:id/summary, GET /api/series/:id/votes/summary                                          |
| Vote Screen            | POST /api/series/:id/votes                                                                              |
| Tie-Break              | POST /api/series/:id/decisions/tie-break                                                                |
| Ranking                | GET /api/rankings/periods/:period                                                                       |
| Ranking Import         | POST /api/rankings/import                                                                               |
| At-Risk                | GET /api/rankings?status=AT_RISK, POST /api/series/:id/cancel                                           |

# 10. Security and Permission Rules

| **Rule**       | **Specification**                                                                      |
|----------------|----------------------------------------------------------------------------------------|
| Authentication | All protected mobile API requests use JWT token.                                       |
| Editor Access  | Editor only accesses assigned series and related review items.                         |
| Board Access   | Board sees series summary, ranking, votes, decisions; not detailed manga pages in MVP. |
| Board Chair    | Only BOARD_CHAIR can see and execute tie-break actions.                                |
| Signed URL     | All private file previews must be loaded via backend signed URL.                       |
| Final Decision | Final approval, rejection, cancellation, tie-break require confirmation dialog.        |
| No Role Trust  | Mobile client never sends trusted role; backend validates from token and DB.           |

# 11. MVP Priority

| **Priority** | **Tantou Editor**                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------------------|
| Must Have    | Home, Assigned Series, Manuscript Review, Page Review, Comment Queue, Publication Readiness, Notifications. |
| Should Have  | Ranking Support, Quick Task Creation, Push Notification.                                                    |
| Could Have   | Tablet annotation, before/after compare, offline queue.                                                     |

| **Priority** | **Editorial Board**                                                                               |
|--------------|---------------------------------------------------------------------------------------------------|
| Must Have    | Home, Approval Queue, Series Approval Detail, Vote, Ranking Table, At-Risk Series, Notifications. |
| Should Have  | Chair Tie-Break, Ranking Import, Decision History.                                                |
| Could Have   | Advanced analytics, voice note decision, offline reading.                                         |

# 12. Acceptance Criteria

| **ID**         | **Acceptance Criteria**                                                             |
|----------------|-------------------------------------------------------------------------------------|
| MOB-ED-001     | Tantou Editor can view assigned series and pending review items on mobile.          |
| MOB-ED-002     | Tantou Editor can approve or request revision for manuscript and page review items. |
| MOB-ED-003     | Tantou Editor can resolve and reopen comments according to comment state rules.     |
| MOB-ED-004     | Tantou Editor cannot approve publication if unresolved comments exist.              |
| MOB-BD-001     | Board member can view series summary and vote approve/reject/needs revision.        |
| MOB-BD-002     | Board member cannot view detailed manga pages in MVP.                               |
| MOB-BD-003     | Board Chair can see tie-break alerts and finalize tie-break decision.               |
| MOB-BD-004     | Board can view ranking using finalScore formula and at-risk status.                 |
| MOB-COMMON-001 | All mobile screens respect role-based permission from backend.                      |
| MOB-COMMON-002 | All final decisions require confirmation dialog.                                    |
| MOB-COMMON-003 | Mobile UI uses Fresh Pastel Creative theme, not dark technology theme.              |

# 13. Final Notes

- Mobile MVP should prioritize review speed and decision confidence over
  heavy editing features.

- Tantou Editor mobile is strongest for monitoring, comments, approval,
  and readiness checks.

- Editorial Board mobile is strongest for summary review, voting,
  ranking, and urgent decisions.

- Desktop web remains the primary tool for canvas-heavy production and
  detailed page operations.
